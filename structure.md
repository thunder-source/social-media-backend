backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── passport.ts
│   │   ├── firebase.ts
│   │   └── swagger.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   ├── Chat.ts
│   │   ├── Message.ts
│   │   ├── FriendRequest.ts
│   │   └── Notification.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── post.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── friend.routes.ts
│   │   └── notification.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── friend.controller.ts
│   │   └── notification.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── services/
│   │   ├── firebase.service.ts
│   │   ├── socket.service.ts
│   │   └── notification.service.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   ├── socket/
│   │   └── socketHandlers.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
