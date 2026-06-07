"use client";

import Pusher from "pusher-js";

let pusherClient = null;

if (typeof window !== "undefined") {
  pusherClient = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_KEY,
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    }
  );
}

export default pusherClient;