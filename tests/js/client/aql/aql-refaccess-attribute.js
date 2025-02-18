/*jshint globalstrict:false, strict:false, maxlen: 500 */
/*global assertEqual */

////////////////////////////////////////////////////////////////////////////////
/// @brief tests for query language, ref access
///
/// DISCLAIMER
///
/// Copyright 2010-2012 triagens GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2012, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

const internal = require("internal");
const jsunity = require("jsunity");
const helper = require("@arangodb/aql-helper");
const getQueryResults = helper.getQueryResults;

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function ahuacatlRefAccessAttributeTestSuite () {
  let collection;

////////////////////////////////////////////////////////////////////////////////
/// @brief execute a given query and return the results as an array
////////////////////////////////////////////////////////////////////////////////

  function runQuery (query) {
    return getQueryResults("FOR i IN " + collection.name() + " FOR j IN " + collection.name() + " FILTER " + query + " SORT i.val RETURN i.val");
  }

  return {

    setUpAll : function () {
      internal.db._drop("UnitTestsAhuacatlRefAccess");
      collection = internal.db._create("UnitTestsAhuacatlRefAccess");

      let docs = [];
      for (let i = 1; i <= 10; ++i) {
        docs.push({ "val" : i });
      }
      collection.insert(docs);

      collection.ensureIndex({ type: "persistent", fields: ["val"] });
    },

    tearDownAll : function () {
      internal.db._drop("UnitTestsAhuacatlRefAccess");
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefEq : function () {
      const expected = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

      assertEqual(expected, runQuery("(i.val == j.val)"));
      assertEqual(expected, runQuery("(j.val == i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefGt : function () {
      const expected = [ 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10 ];

      assertEqual(expected, runQuery("(i.val > j.val)"));
      assertEqual(expected, runQuery("(j.val < i.val)")); 
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefGe : function () {
      const expected = [ 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ];

      assertEqual(expected, runQuery("(i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefLt : function () {
      const expected = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9 ];

      assertEqual(expected, runQuery("(i.val < j.val)"));
      assertEqual(expected, runQuery("(j.val > i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefLe : function () {
      const expected = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 10 ];

      assertEqual(expected, runQuery("(i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd1 : function () {
      const expected = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

      assertEqual(expected, runQuery("(i.val == j.val && i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val == i.val && j.val <= i.val)"));
      assertEqual(expected, runQuery("(i.val >= j.val && i.val == j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val && j.val == i.val)"));

      assertEqual(expected, runQuery("(i.val == j.val && i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val == i.val && j.val >= i.val)"));
      assertEqual(expected, runQuery("(i.val <= j.val && i.val == j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val && j.val == i.val)"));

      assertEqual(expected, runQuery("(i.val == j.val && i.val == j.val)"));
      assertEqual(expected, runQuery("(j.val == i.val && j.val == i.val)"));
      
      assertEqual(expected, runQuery("(i.val <= j.val && i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val && j.val <= i.val)"));
      assertEqual(expected, runQuery("(i.val >= j.val && i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val && j.val >= i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd2 : function () {
      const expected = [ 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10 ];

      assertEqual(expected, runQuery("(i.val > j.val && i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val < i.val && j.val <= i.val)"));
      assertEqual(expected, runQuery("(i.val >= j.val && i.val > j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val && j.val < i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd3 : function () {
      const expected = [ 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ];

      assertEqual(expected, runQuery("(i.val >= j.val && i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val && j.val <= i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd4 : function () {
      const expected = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9 ];

      assertEqual(expected, runQuery("(i.val < j.val && i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val > i.val && j.val >= i.val)"));
      assertEqual(expected, runQuery("(i.val <= j.val && i.val < j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val && j.val > i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd5 : function () {
      const expected = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 10 ];

      assertEqual(expected, runQuery("(i.val <= j.val && i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val && j.val >= i.val)"));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ref access
////////////////////////////////////////////////////////////////////////////////

    testRefMergeAnd6 : function () {
      const expected = [ ];

      assertEqual(expected, runQuery("(i.val > j.val && i.val < j.val)"));
      assertEqual(expected, runQuery("(j.val < i.val && j.val > i.val)"));
      assertEqual(expected, runQuery("(i.val < j.val && i.val > j.val)"));
      assertEqual(expected, runQuery("(j.val > i.val && j.val < i.val)"));
      
      assertEqual(expected, runQuery("(i.val >= j.val && i.val < j.val)"));
      assertEqual(expected, runQuery("(j.val <= i.val && j.val > i.val)"));
      assertEqual(expected, runQuery("(i.val < j.val && i.val >= j.val)"));
      assertEqual(expected, runQuery("(j.val > i.val && j.val <= i.val)"));
      
      assertEqual(expected, runQuery("(i.val > j.val && i.val <= j.val)"));
      assertEqual(expected, runQuery("(j.val < i.val && j.val >= i.val)"));
      assertEqual(expected, runQuery("(i.val <= j.val && i.val > j.val)"));
      assertEqual(expected, runQuery("(j.val >= i.val && j.val < i.val)"));
    }

  };

}

jsunity.run(ahuacatlRefAccessAttributeTestSuite);

return jsunity.done();
