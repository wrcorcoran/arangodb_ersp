'use strict';

// //////////////////////////////////////////////////////////////////////////////
// / DISCLAIMER
// /
// / Copyright 2013-2014 triAGENS GmbH, Cologne, Germany
// / Copyright 2015 ArangoDB GmbH, Cologne, Germany
// /
// / Licensed under the Apache License, Version 2.0 (the "License")
// / you may not use this file except in compliance with the License.
// / You may obtain a copy of the License at
// /
// /     http://www.apache.org/licenses/LICENSE-2.0
// /
// / Unless required by applicable law or agreed to in writing, software
// / distributed under the License is distributed on an "AS IS" BASIS,
// / WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// / See the License for the specific language governing permissions and
// / limitations under the License.
// /
// / Copyright holder is ArangoDB GmbH, Cologne, Germany
// /
// / @author Lucas Dohmen
// / @author Alan Plum
// //////////////////////////////////////////////////////////////////////////////

const Model = require('@arangodb/foxx/legacy/model').Model;
const _ = require('lodash');
const extend = require('@arangodb/extend').extend;
const EventEmitter = require('events').EventEmitter;

const EVENTS = [
  'beforeSave', 'beforeCreate', 'beforeUpdate', 'beforeRemove',
  'afterSave', 'afterCreate', 'afterUpdate', 'afterRemove'
];

function Repository (collection, opts) {

  this.options = opts || {};

  this.collection = collection;

  this.model = this.options.model || Model;

  Object.defineProperty(this, 'modelSchema', {
    configurable: false,
    enumerable: true,
    get() {
      return this.model.prototype.schema;
    }
  });

  this.prefix = this.options.prefix;

  // Undocumented, unfinished graph feature
  this.graph = this.options.graph;

  if (this.indexes) {
    _.each(this.indexes, function (index) {
      this.collection.ensureIndex(index);
    }.bind(this));
  }

  EventEmitter.call(this);

  Object.keys(this.model).forEach(function (eventName) {
    const listener = this.model[eventName];
    if (EVENTS.indexOf(eventName) === -1 || typeof listener !== 'function') {
      return;
    }
    this.on(eventName, listener.bind(this.model));
  }.bind(this));
}

Repository.prototype = Object.create(EventEmitter.prototype);
Object.assign(Repository.prototype, {

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                                 Adding Entries
  // -----------------------------------------------------------------------------

  save(model) {
    if (!model.forDB) {
      model = new this.model(model);
    }
    this.emit('beforeCreate', model);
    model.emit('beforeCreate');
    this.emit('beforeSave', model);
    model.emit('beforeSave');
    var id_and_rev;
    if (this.collection.type() === 3) {
      id_and_rev = this.collection.save(model.get('_from'), model.get('_to'), model.forDB());
    } else {
      id_and_rev = this.collection.save(model.forDB());
    }
    model.set(id_and_rev);
    this.emit('afterSave', model);
    model.emit('afterSave');
    this.emit('afterCreate', model);
    model.emit('afterCreate');
    return model;
  },

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                                Finding Entries
  // -----------------------------------------------------------------------------

  byId(id) {
    var data = this.collection.document(id);
    return new this.model(data);
  },

  byExample(example) {
    var rawDocuments = this.collection.byExample(example).toArray();
    return _.map(rawDocuments, function (rawDocument) {
      return new this.model(rawDocument);
    }.bind(this));
  },

  firstExample(example) {
    var rawDocument = this.collection.firstExample(example);
    return rawDocument ? new this.model(rawDocument) : null;
  },

  all(options) {
    if (!options) {
      options = {};
    }
    var rawDocuments = this.collection.all();
    if (options.skip) {
      rawDocuments = rawDocuments.skip(options.skip);
    }
    if (options.limit) {
      rawDocuments = rawDocuments.limit(options.limit);
    }
    return _.map(rawDocuments.toArray(), function (rawDocument) {
      return new this.model(rawDocument);
    }.bind(this));
  },

  any() {
    var data = this.collection.any();
    if (!data) {
      return null;
    }
    return new this.model(data);
  },

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                               Removing Entries
  // -----------------------------------------------------------------------------

  remove(model) {
    this.emit('beforeRemove', model);
    model.emit('beforeRemove');
    var id = model.get('_id'),
      result = this.collection.remove(id);
    this.emit('afterRemove', model);
    model.emit('afterRemove');
    return result;
  },

  removeById(id) {
    return this.collection.remove(id);
  },

  removeByExample(example) {
    return this.collection.removeByExample(example);
  },

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                              Replacing Entries
  // -----------------------------------------------------------------------------

  replace(model) {
    var id = model.get('_id') || model.get('_key'),
      data = model.forDB(),
      id_and_rev = this.collection.replace(id, data);
    model.set(id_and_rev);
    return model;
  },

  replaceById(id, data) {
    if (data instanceof Model) {
      var id_and_rev = this.collection.replace(id, data.forDB());
      data.set(id_and_rev);
      return data;
    }
    return this.collection.replace(id, data);
  },

  replaceByExample(example, data) {
    return this.collection.replaceByExample(example, data);
  },

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                               Updating Entries
  // -----------------------------------------------------------------------------

  update(model, data) {
    this.emit('beforeUpdate', model, data);
    model.emit('beforeUpdate', data);
    this.emit('beforeSave', model, data);
    model.emit('beforeSave', data);
    var id = model.get('_id') || model.get('_key'),
      id_and_rev = this.collection.update(id, data);
    model.set(data);
    model.set(id_and_rev);
    this.emit('afterSave', model, data);
    model.emit('afterSave', data);
    this.emit('afterUpdate', model, data);
    model.emit('afterUpdate', data);
    return model;
  },

  updateById(id, data) {
    if (data instanceof Model) {
      var id_and_rev = this.collection.update(id, data.forDB());
      data.set(id_and_rev);
      return data;
    }
    return this.collection.update(id, data);
  },

  updateByExample(example, data, options) {
    return this.collection.updateByExample(example, data, options);
  },

  exists(id) {
    return this.collection.exists(id);
  },

  // -----------------------------------------------------------------------------
  // --SUBSECTION--                                               Counting Entries
  // -----------------------------------------------------------------------------

  count() {
    return this.collection.count();
  }
});

var indexPrototypes = {
  skiplist: {

    range(attribute, left, right) {
      var rawDocuments = this.collection.range(attribute, left, right).toArray();
      return _.map(rawDocuments, function (rawDocument) {
        return new this.model(rawDocument);
      }.bind(this));
    }
  },
  geo: {

    near(latitude, longitude, options) {
      var collection = this.collection,
        rawDocuments;
      if (!options) {
        options = {};
      }
      if (options.geo) {
        collection = collection.geo(options.geo);
      }
      rawDocuments = collection.near(latitude, longitude);
      if (options.distance) {
        rawDocuments = rawDocuments.distance();
      }
      if (options.limit) {
        rawDocuments = rawDocuments.limit(options.limit);
      }
      return _.map(rawDocuments.toArray(), function (rawDocument) {
        var model = (new this.model(rawDocument)),
          distance;
        if (options.distance) {
          delete model.attributes._distance;
          distance = typeof options.distance === 'string' ? options.distance : 'distance';
          model[distance] = rawDocument._distance;
        }
        return model;
      }.bind(this));
    },

    within(latitude, longitude, radius, options) {
      var collection = this.collection,
        rawDocuments;
      if (!options) {
        options = {};
      }
      if (options.geo) {
        collection = collection.geo(options.geo);
      }
      rawDocuments = collection.within(latitude, longitude, radius);
      if (options.distance) {
        rawDocuments = rawDocuments.distance();
      }
      if (options.limit) {
        rawDocuments = rawDocuments.limit(options.limit);
      }
      return _.map(rawDocuments.toArray(), function (rawDocument) {
        var model = (new this.model(rawDocument)),
          distance;
        if (options.distance) {
          delete model.attributes._distance;
          distance = typeof options.distance === 'string' ? options.distance : 'distance';
          model[distance] = rawDocument._distance;
        }
        return model;
      }.bind(this));
    }
  },
  fulltext: {

    fulltext(attribute, query, options) {
      if (!options) {
        options = {};
      }
      var rawDocuments = this.collection.fulltext(attribute, query);
      if (options.limit) {
        rawDocuments = rawDocuments.limit(options.limit);
      }
      return _.map(rawDocuments.toArray(), function (rawDocument) {
        return new this.model(rawDocument);
      }.bind(this));
    }
  }
};

function addIndexMethods (prototype) {
  _.each(prototype.indexes, function (index) {
    var protoMethods = indexPrototypes[index.type];
    if (!protoMethods) {
      return;
    }
    _.each(protoMethods, function (method, key) {
      if (prototype[key] === undefined) {
        prototype[key] = method;
      }
    });
  });
}

Repository.extend = function (protoProps, staticProps) {
  var constructor = extend.call(this, protoProps, staticProps);
  if (constructor.prototype.hasOwnProperty('indexes')) {
    addIndexMethods(constructor.prototype);
  }
  return constructor;
};

exports.Repository = Repository;
