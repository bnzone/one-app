/*
 * Copyright 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import addFrameOptionsHeader from '../../../src/server/plugins/addFrameOptionsHeader';
import { updateCSP } from '../../../src/server/plugins/csp';

beforeEach(() => {
  updateCSP('');
});

describe('empty frame-ancestors', () => {
  it('does not add frame options header', () => {
    const request = {
      headers: {},
    };
    const reply = {
      header: jest.fn(),
    };
    const fastify = {
      addHook: jest.fn(async (_hook, cb) => {
        await cb(request, reply);
      }),
    };
    const done = jest.fn();

    addFrameOptionsHeader(fastify, null, done);

    expect(fastify.addHook).toHaveBeenCalled();
    expect(done).toHaveBeenCalled();
    expect(reply.header).not.toHaveBeenCalled();
  });
});

describe('no matching domains', () => {
  it('does not add frame options header', () => {
    updateCSP('frame-ancestors americanexpress.com;');
    const request = {
      headers: {},
    };
    const reply = {
      header: jest.fn(),
    };
    const fastify = {
      addHook: jest.fn(async (_hook, cb) => {
        await cb(request, reply);
      }),
    };
    const done = jest.fn();

    addFrameOptionsHeader(fastify, null, done);

    expect(fastify.addHook).toHaveBeenCalled();
    expect(done).toHaveBeenCalled();
    expect(reply.header).not.toHaveBeenCalled();
  });
});

it('adds frame options header', () => {
  updateCSP('frame-ancestors americanexpress.com;');
  const request = {
    headers: {
      Referer: 'https://americanexpress.com/testing',
    },
  };
  const reply = {
    header: jest.fn(),
  };
  const fastify = {
    addHook: jest.fn(async (_hook, cb) => {
      await cb(request, reply);
    }),
  };
  const done = jest.fn();

  addFrameOptionsHeader(fastify, null, done);

  expect(fastify.addHook).toHaveBeenCalled();
  expect(done).toHaveBeenCalled();
  expect(reply.header).toHaveBeenCalledTimes(1);
  expect(reply.header).toHaveBeenCalledWith('X-Frame-Options', 'ALLOW-FROM https://americanexpress.com/testing');
});
