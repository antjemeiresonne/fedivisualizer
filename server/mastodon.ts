import WebSocket from 'ws'
import 'dotenv/config'
import { addPostToStore, addReblogToStore } from './rdf-store.js'

interface ProcessedPost {
    id: string
    content: string
    author: string
    avatar: string
    createdAt: string
    favourites: number
    reblogs: number
    replies: number
    tags: string[]
    mentions: string[]
    mediaAttachments: number
    inReplyTo: string | null
    url: string
}

interface HashtagPost {
    id: string
    author: string
    content: string
    createdAt: string
    url: string
}

interface PostConnection {
    from: string
    to: string
    fromAuthor: string
    toAuthor: string
}

interface CachedPost {
    id: string
    account: { username: string }
    in_reply_to_id: string | null
}

type BroadcastFunction = (message: {
    type: string
    data: ProcessedPost | HashtagPost | PostConnection
}) => void

let mastodonStream: WebSocket | null = null
let broadcastFn: BroadcastFunction | null = null
const postCache = new Map<string, CachedPost>()

function processPost(post: CachedPost): void {
    postCache.set(post.id, post)

    if (post.in_reply_to_id && postCache.has(post.in_reply_to_id)) {
        const parent = postCache.get(post.in_reply_to_id)!

        if (broadcastFn) {
            broadcastFn({
                type: 'connection',
                data: {
                    from: post.id,
                    to: post.in_reply_to_id,
                    fromAuthor: post.account.username,
                    toAuthor: parent.account.username,
                },
            })
        }
    }
}

export function initMastodon(broadcast: BroadcastFunction): void {
    broadcastFn = broadcast
    connectMastodon()
    pollHashtag()
    setInterval(pollHashtag, 30000)
}

function connectMastodon(): void {
    console.log('🐘 Verbinden met Mastodon public stream...')

    const token = process.env.MASTODON_ACCESS_TOKEN
    const url = `wss://streaming.mastodon.social/api/v1/streaming?stream=public&access_token=${token}`

    mastodonStream = new WebSocket(url)
    mastodonStream.on('open', () => {
        console.log('✅ Mastodon stream verbonden')
    })

    mastodonStream.on('message', (data: WebSocket.RawData) => {
        try {
            const event = JSON.parse(data.toString())

            if (event.event === 'update') {
                const post = JSON.parse(event.payload)

                processPost(post)

                const processedPost: ProcessedPost = {
                    id: post.id,
                    content: post.content.replace(/<[^>]*>/g, ''),
                    author: post.account.username,
                    avatar: post.account.avatar,
                    createdAt: post.created_at,
                    favourites: post.favourites_count,
                    reblogs: post.reblogs_count,
                    replies: post.replies_count,
                    tags: post.tags.map((t: { name: string }) => t.name),
                    mentions: post.mentions.map((m: { username: string }) => m.username),
                    mediaAttachments: post.media_attachments.length,
                    inReplyTo: post.in_reply_to_id,
                    url: post.url,
                }

                // Store in RDF graph for SPARQL queries
                addPostToStore(processedPost)

                // Handle reblogs (creates orbit relationship)
                if (post.reblog) {
                    addReblogToStore(
                        post.account.username,
                        post.reblog.account.username,
                        post.reblog.id
                    )
                }

                if (broadcastFn) {
                    broadcastFn({
                        type: 'activitypub',
                        data: processedPost,
                    })
                }

            }
        } catch (error) {
            console.error('Error processing Mastodon message:', error)
        }
    })

    mastodonStream.on('error', (error: Error) => {
        console.error('❌ Mastodon stream error:', error)
    })

    mastodonStream.on('close', () => {
        console.log('🔌 Mastodon stream gesloten, herverbinden in 5 sec...')
        setTimeout(connectMastodon, 5000)
    })
}

async function pollHashtag(): Promise<void> {
    try {
        const response = await fetch(
            'https://mastodon.social/api/v1/timelines/tag/Fedivisualizer?limit=20',
        )
        const posts = await response.json()

        posts.forEach(
            (post: {
                id: string
                account: { username: string }
                content: string
                created_at: string
                url: string
            }) => {
                if (broadcastFn) {
                    broadcastFn({
                        type: 'project_hashtag',
                        data: {
                            id: post.id,
                            author: post.account.username,
                            content: post.content.replace(/<[^>]*>/g, ''),
                            createdAt: post.created_at,
                            url: post.url,
                        },
                    })
                }
            },
        )

        console.log(`#️⃣ Hashtag check: ${posts.length} posts`)
    } catch (error) {
        console.error('Hashtag poll error:', error)
    }
}

