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

import { getModule } from 'holocron';
import { updateModuleRegistry } from 'holocron/server';
import { CONFIGURATION_KEY } from '../../../src/server/utils/onModuleLoad';
import loadModules from '../../../src/server/utils/loadModules';
import { updateCSP } from '../../../src/server/plugins/csp';
import { setClientModuleMapCache, getClientModuleMapCache } from '../../../src/server/utils/clientModuleMapCache';
import addBaseUrlToModuleMap from '../../../src/server/utils/addBaseUrlToModuleMap';

// This named export exists only on the mock
// eslint-disable-next-line import/named

jest.mock('holocron');
jest.mock(
  'holocron/server',
  () => ({
    updateModuleRegistry: jest.fn(),
  })
);
jest.mock('../../../src/server/utils/stateConfig', () => ({
  getServerStateConfig: jest.fn(() => ({
    rootModuleName: 'some-root',
  })),
}));

jest.mock('../../../src/server/plugins/csp', () => ({
  updateCSP: jest.fn(),
}));

const RootModule = () => ({});

let modules;
let fetchedModuleMap;
function setFetchedRootModuleVersion(version) {
  modules = {
    'some-root': {
      node: {
        url: `https://example.com/cdn/some-root/${version}/some-root.node.js`,
        integrity: '4y45hr',
      },
      browser: {
        url: `https://example.com/cdn/some-root/${version}/some-root.browser.js`,
        integrity: 'nggdfhr34',
      },
      legacyBrowser: {
        url: `https://example.com/cdn/some-root/${version}/some-root.legacy.browser.js`,
        integrity: '7567ee',
      },
    },
  };

  fetchedModuleMap = { modules };
}

describe('loadModules', () => {
  beforeAll(() => {
    getModule.mockImplementation(() => RootModule);
    updateModuleRegistry.mockImplementation(() => modules);

    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve(fetchedModuleMap),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setClientModuleMapCache({ modules: {} });
  });

  it('updates the holocron module registry', async () => {
    setFetchedRootModuleVersion('1.1.1');
    await loadModules();
    expect(updateModuleRegistry).toHaveBeenCalledWith({
      moduleMap: addBaseUrlToModuleMap(fetchedModuleMap),
      batchModulesToUpdate: require('../../../src/server/utils/batchModulesToUpdate').default,
      getModulesToUpdate: require('../../../src/server/utils/getModulesToUpdate').default,
      onModuleLoad: require('../../../src/server/utils/onModuleLoad').default,
    });
  });

  it('updates the client module map cache', async () => {
    setFetchedRootModuleVersion('1.1.2');
    await loadModules();
    expect(getClientModuleMapCache()).toMatchSnapshot();
  });

  it('returns loaded modules', async () => {
    setFetchedRootModuleVersion('2.0.0');
    const loadedModules = await loadModules();
    expect(loadedModules).toEqual({
      'some-root': {
        browser: {
          integrity: 'nggdfhr34',
          url: 'https://example.com/cdn/some-root/2.0.0/some-root.browser.js',
        },
        legacyBrowser: {
          integrity: '7567ee',
          url: 'https://example.com/cdn/some-root/2.0.0/some-root.legacy.browser.js',
        },
        node: {
          integrity: '4y45hr',
          url: 'https://example.com/cdn/some-root/2.0.0/some-root.node.js',
        },
      },
    });
  });

  it('doesnt update caches when there are no changes', async () => {
    setFetchedRootModuleVersion('1.1.3');
    updateModuleRegistry.mockImplementationOnce(() => ({}));
    await loadModules();
    expect(getClientModuleMapCache()).toMatchSnapshot();
  });

  it('updates CSP when csp is set on root module if root module is loaded', async () => {
    RootModule[CONFIGURATION_KEY] = {
      csp: "default-src 'none';",
    };
    setFetchedRootModuleVersion('1.1.4');
    await loadModules();
    expect(updateCSP).toHaveBeenCalledWith("default-src 'none';");
  });

  it('calls updateCSP even when csp is not set', async () => {
    setFetchedRootModuleVersion('1.1.5');
    delete RootModule[CONFIGURATION_KEY].csp;
    await loadModules();
    expect(updateCSP).toHaveBeenCalledWith(undefined);
  });

  describe('when root module not loaded', () => {
    beforeAll(() => {
      updateModuleRegistry.mockImplementation(() => ({
        'not-a-root': {
          node: {
            url: 'https://example.com/cdn/not-a-root/2.2.2/not-a-root.node.js',
            integrity: '4y45hr',
          },
          browser: {
            url: 'https://example.com/cdn/not-a-root/2.2.2/not-a-root.browser.js',
            integrity: 'nggdfhr34',
          },
          legacyBrowser: {
            url: 'https://example.com/cdn/not-a-root/2.2.2/not-a-root.legacy.browser.js',
            integrity: '7567ee',
          },
        },
      }));
    });

    it('does not attempt to update CSP', async () => {
      setFetchedRootModuleVersion('1.1.6');
      await loadModules();
      expect(updateCSP).not.toHaveBeenCalled();
    });
  });

  describe('when module map does not change', () => {
    beforeAll(async () => {
      setFetchedRootModuleVersion('1.1.1');
      await loadModules();
      jest.clearAllMocks();
    });
    it('does not updateModuleRegistry', async () => {
      await loadModules();
      expect(updateModuleRegistry).not.toHaveBeenCalled();
    });
    it('does not return any modules', async () => {
      const loadedModules = await loadModules();
      expect(loadedModules).toEqual({});
    });
  });
});
