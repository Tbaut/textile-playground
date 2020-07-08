import React from 'react';
import { createAPISig, Client, KeyInfo, ThreadID, UserAuth } from '@textile/hub';
import { DBInfo } from '@textile/threads-client';

const key = process.env.REACT_APP_HUB_KEY || '';
const secret = process.env.REACT_APP_HUB_SECRET || '';

const personSchema = {
  $id: 'https://example.com/person.schema.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Person',
  type: 'object',
  required: ['_id'],
  properties: {
    _id: {
      type: 'string',
      description: "The instance's id.",
    },
    firstName: {
      type: 'string',
      description: "The person's first name.",
    },
    lastName: {
      type: 'string',
      description: "The person's last name.",
    },
    age: {
      description: 'Age in years which must be equal to or greater than zero.',
      type: 'integer',
      minimum: 0,
    },
  },
};

// Minimal schema representation
const schema2 = {
  properties: {
    _id: { type: 'string' },
    fullName: { type: 'string' },
    age: { type: 'integer', minimum: 0 },
  },
};

interface Person {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
}

async function getClientWithKeyInfo(): Promise<Client> {
  const keyInfo: KeyInfo = {
    key,
    secret,
  };

  const client = await Client.withKeyInfo(keyInfo);
  return client;
}

async function setup(auth?: UserAuth): Promise<void> {
  if (!key || !secret) {
    throw 'REACT_APP_HUB_KEY and REACT_APP_HUB_SECRET need to be set as env variable';
  }

  const user = await Client.randomIdentity();

  // for our user
  // const secondsExpiration = 3600;
  // const expiration = new Date(Date.now() + 1000 * secondsExpiration);
  // const apiSig = await createAPISig(secret, expiration);

  const client = await getClientWithKeyInfo();

  // a new token needs to be created on the hub (otherwise it throws)
  // ? ----> But this token is never used
  const token = await client.getToken(user);

  const threadId = ThreadID.fromRandom();
  console.log('ThreadID', threadId.toString());

  const thread = await client.newDB(threadId, 'space');
  const threadString = thread.toString();

  const info = await client.getDBInfo(threadId);
  console.log('info', info);

  // This will be overriden right after
  // const register = await client.newCollection(thread, 'Person', personSchema);
  // console.log('register', register);

  const astronaut = {
    _id: '',
    name: 'Buzz',
    missions: 13,
  };
  const collectionName = 'astronauts';

  // create collection named $collectionName from the previously defined astronaut object
  await client.newCollectionFromObject(thread, collectionName, astronaut);
  await client.create(thread, collectionName, [{ ...astronaut }]);
  const data = await client.find(thread, collectionName, {});

  console.log('data', data);
  // // create a new instance un the collection $collectionName
  // await client.create(thread, collectionName, [{ name: 'Bla', missions: 11 }]);

  // console.debug('found:', found.instancesList);
  const user2 = await Client.randomIdentity();

  // for our user
  // const secondsExpiration = 3600;
  // const expiration = new Date(Date.now() + 1000 * secondsExpiration);
  // const apiSig = await createAPISig(secret, expiration);
  const client2 = await getClientWithKeyInfo();

  // a new token needs to be created on the hub (otherwise it throws)
  // ? ----> But this token is never used
  const token2 = await client2.getToken(user2);

  // const info2 = await client2.getThread('space');
  const thread2 = ThreadID.fromString(threadString);
  const data2 = await client.find(thread2, collectionName, {});

  console.log('data', data2);
}

const Threadtest = (): JSX.Element => {
  setup();

  return <>bla</>;
};

export default Threadtest;
