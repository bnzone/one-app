/* eslint-disable global-require */
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

import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { fromJS } from 'immutable';
import ModuleRoute from 'holocron-module-route';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import HelloWorldComponent from './HelloWorld';
import Partial, { onPartialRouteEnter } from './Partial';

export function FrankLloydRoot({ children, config }) {
  return (
    <React.Fragment>
      <Helmet
        title="Sample Root Module"
        link={[
          { rel: 'icon', href: 'https://sample-cdn.frank/favicon.ico' },
        ]}
      />
      <pre className="value-provided-from-config">{ config.get('someApiUrl') }</pre>
      { children }
    </React.Fragment>
  );
}

FrankLloydRoot.childRoutes = (store) => [
  <ModuleRoute key="vitruvius" path="vitruvius" moduleName="vitruvius-franklin" />,
  <ModuleRoute key="success" path="success" component={HelloWorldComponent} />,
  <ModuleRoute key="healthy" path="healthy-frank" moduleName="healthy-frank" />,
  <ModuleRoute key="demo" path="demo/:moduleName" moduleName="preview-frank" />,
  <ModuleRoute key="html" path="html-partial/:locale/:moduleName" component={Partial} onEnter={onPartialRouteEnter(store, true)} />,
  <ModuleRoute key="text" path="text-only/:locale/:moduleName" component={Partial} onEnter={onPartialRouteEnter(store, false, true)} />,
];

FrankLloydRoot.propTypes = {
  children: PropTypes.node.isRequired,
  config: ImmutablePropTypes.map.isRequired,
};

if (!global.BROWSER) {
  // eslint-disable-next-line global-require
  FrankLloydRoot.appConfig = require('../config').default;
}

const reducer = (state = fromJS({})) => state;
reducer.buildInitialState = ({ req } = {}) => {
  if (req && req.body) {
    return fromJS({ postProps: req.body });
  }
  return fromJS({});
};

FrankLloydRoot.holocron = {
  name: 'frank-lloyd-root',
  reducer,
};

export default connect((state) => ({ config: state.get('config') }))(FrankLloydRoot);
