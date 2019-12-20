import React from 'react';
import { Client, KeyInfo, ThreadID, UserAuth } from '@textile/threads';

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

const createPerson = (): Person => {
  return {
    _id: '',
    firstName: 'Adam',
    lastName: 'Doe',
    age: 21,
  };
};

async function getClientWithKeyInfo(): Promise<Client> {
  const key = process.env.REACT_APP_HUB_KEY;
  const secret = process.env.REACT_APP_HUB_SECRET;

  if (!key || !secret) {
    throw 'REACT_APP_HUB_KEY and REACT_APP_HUB_SECRET need to be set as env variable';
  }

  const keyInfo: KeyInfo = {
    key,
    secret,
    type: 0, // user group key
  };

  const client = await Client.withKeyInfo(keyInfo);
  return client;
}

async function setup(auth?: UserAuth): Promise<void> {
  const user = await Client.randomIdentity();

  // const client = await Client.withUserAuth(auth);
  const client = await getClientWithKeyInfo();

  // a new token needs to be created on the hub (otherwise it throws)
  // ? ----> But this token is never used
  const token = await client.getToken(user);

  // This thread is our DB
  const thread: ThreadID = await client.newDB();

  // This will be overriden right after
  const register = await client.newCollection(thread, 'Person', personSchema);
  console.log('register', register);

  const list = await client.getCollectionIndexes(thread, 'Person');
  console.log('list', list);

  await client.updateCollection(thread, 'Person', schema2, [
    {
      path: 'age',
      unique: false,
    },
  ]);

  await client.create(thread, 'Person', [
    {
      _id: '',
      fullName: 'Madonna',
      age: 0,
    },
  ]);

  const indexes = await client.getCollectionIndexes(thread, 'Person');
  console.log('indexes', indexes);

  const info = await client.getDBInfo(thread);
  console.log('info', info);

  // throwing
  const dbs = await client.listDBs();
  console.log('dbs', dbs);

  // // it needs an "_id" of type string
  // const astronaut = {
  //   _id: '',
  //   name: 'Buzz',
  //   missions: 13,
  // };
  // const collectionName = 'astronauts';

  // // create collection named $collectionName from the previously defined astronaut object
  // await client.newCollectionFromObject(thread, collectionName, astronaut);

  // // create a new instance un the collection $collectionName
  // await client.create(thread, collectionName, [{ name: 'Bla', missions: 11 }]);

  // // get all the instances from this collection name
  // const found = await client.find(thread, collectionName, {});

  // console.debug('found:', found.instancesList);
}

const Threadtest = (): JSX.Element => {
  setup();

  return <>bla</>;
};

export default Threadtest;
