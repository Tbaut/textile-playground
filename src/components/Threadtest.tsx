import React, { useState, useEffect } from 'react';
import { createAPISig, Client, KeyInfo, ThreadID, UserAuth } from '@textile/hub';
import { Libp2pCryptoIdentity } from '@textile/threads-core';
import { Where } from '@textile/threads-client';

const key = process.env.REACT_APP_HUB_KEY || '';
const secret = process.env.REACT_APP_HUB_SECRET || '';
enum collection {
  POST = 'post',
  COMMENT = 'comment',
}

// Q: is string for createdAd the best?
interface Post {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAd: string;
}

interface Comment {
  _id: string;
  postId: string;
  title: string;
  content: string;
  author: string;
  createdAd: string;
}

const postSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Post',
  type: 'object',
  required: ['_id'],
  properties: {
    _id: {
      type: 'string',
      description: 'The post id.',
    },
    title: {
      type: 'string',
      description: 'This post title.',
    },
    content: {
      type: 'string',
      description: 'This post content.',
    },
    author: {
      type: 'string',
      description: 'The author id.',
    },
    createdAt: {
      type: 'string',
      description: 'The creation date of the post',
    },
  },
};

const commentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Comment',
  properties: {
    _id: {
      type: 'string',
      description: "The instance's (comment) id.",
    },
    postId: {
      type: 'string',
      description: "The forum post's id to which the comment is linked to.",
    },
    content: {
      type: 'string',
      description: 'This post content.',
    },
    author: {
      type: 'string',
      description: 'The author id.',
    },
    createdAt: {
      type: 'string',
      description: 'The creation date of the post',
    },
  },
};

async function getClientWithKeyInfo(): Promise<Client> {
  const keyInfo: KeyInfo = {
    key,
    secret,
  };

  const client = await Client.withKeyInfo(keyInfo);
  return client;
}

async function setup(): Promise<any> {
  if (!key || !secret) {
    throw 'REACT_APP_HUB_KEY and REACT_APP_HUB_SECRET need to be set as env variable';
  }

  const user = await Client.randomIdentity();
  // console.log('usertoString', user.toString());
  const test = Libp2pCryptoIdentity.fromString(user.toString());
  // console.log('test', (await test).toString());

  const client = await getClientWithKeyInfo();

  // a new token needs to be created on the hub (otherwise it throws)
  // ? ----> But this token is never used
  const token = await client.getToken(user);

  const threadId = ThreadID.fromRandom();

  const thread = await client.newDB(threadId, 'open-polkassembly');
  const threadString = thread.toString();

  await client.newCollection(thread, collection.POST, postSchema);
  await client.newCollection(thread, collection.COMMENT, commentSchema);

  await client.create(thread, collection.POST, [
    {
      _id: '',
      author: 'john',
      content: 'that is the first post',
      createdAd: Date.now().toString(),
      title: 'Number one',
    } as Post,
  ]);
  const data = await client.find(thread, collection.POST, {});
  console.log('data', data);

  await client.create(thread, collection.COMMENT, [
    {
      _id: '',
      author: 'jen',
      content: 'And a comment to our first post',
      createdAd: Date.now().toString(),
      postId: (data.instancesList[0] as Post)._id,
    } as Comment,
  ]);

  const user2 = await Client.randomIdentity();

  // for our front-end user
  const secondsExpiration = 3600;
  const expiration = new Date(Date.now() + 1000 * secondsExpiration);
  const apiSig = await createAPISig(secret, expiration);
  const client2 = await Client.withUserAuth({ key, sig: apiSig.sig, msg: apiSig.msg, token });

  // a new token needs to be created on the hub (otherwise it throws)
  // ? ----> But this token is never used
  const token2 = await client2.getToken(user2);

  const thread2 = ThreadID.fromString(threadString);
  const result = {};
  const posts = await client.find(thread2, collection.POST, {});
  const post0 = posts.instancesList[0];
  const data2 = await client.find(thread2, collection.COMMENT, new Where('postId').eq(post0._id));
  const comment = data2.instancesList[0];

  return {
    post: {
      title: post0.title,
      content: post0.content,
    },
    comment: {
      content: comment.content,
      createdAt: comment.createdAt,
    },
  };
}

const Threadtest = (): JSX.Element => {
  const [thread, setThread] = useState<any>({});

  useEffect(() => {
    setup()
      .then((t) => setThread(t))
      .catch((e) => console.error(e));
  }, []);

  if (!thread?.post?.title) {
    return <>Loading...</>;
  }

  return (
    <>
      <h1>{thread.post?.title}</h1>
      <p>{thread.post?.content}</p>
      <hr />
      <p>
        {thread.comment.content} - {thread.comment.createdAt}
      </p>
    </>
  );
};

export default Threadtest;
