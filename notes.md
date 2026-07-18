How the Messaging System Works

1. Messages List Page (messages.jsx)

When you open /messages, the page calls GET /api/messages/chats/hiba
The backend fetches ALL messages where hiba is the sender or receiver
It groups them by the other person and returns the latest message for each
The frontend renders each person as a clickable card 2. Conversation Page (ConversationPage.jsx)

When you tap on "rohan", the app navigates to /conversation/rohan
It calls GET /api/messages/conversation/hiba/rohan
The backend fetches all messages between those two users, sorted by time
The frontend renders them as speech bubbles — your messages on the right (teal), theirs on the left (dark) 3. Sending a Message

You type in the input box and hit Enter or the send button
The message instantly appears in the UI (optimistic update — no waiting!)
In the background, it calls POST /api/messages with {sender_id, receiver_id, content}
The backend inserts it into Supabase
