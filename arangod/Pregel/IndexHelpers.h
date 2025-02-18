////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2023 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
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
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Michael Hackstein
////////////////////////////////////////////////////////////////////////////////

#pragma once

#include <memory>
#include <string>

#include "Aql/EdgeConditionBuilderContainer.h"
#include "Indexes/IndexIterator.h"

namespace arangodb {
class Index;
class IndexIterator;
class LogicalCollection;
struct ResourceMonitor;

namespace transaction {
class Methods;
}

namespace traverser {

////////////////////////////////////////////////////////////////////////////////
/// @brief Information required internally of the traverser.
///        Used to easily pass around collections.
///        Also offer abstraction to extract edges.
////////////////////////////////////////////////////////////////////////////////

class EdgeCollectionInfo {
 private:
  ResourceMonitor& _monitor;
  //////////////////////////////////////////////////////////////////////////////
  /// @brief the underlying transaction
  //////////////////////////////////////////////////////////////////////////////

  transaction::Methods* _trx;

  //////////////////////////////////////////////////////////////////////////////
  /// @brief edge collection name
  //////////////////////////////////////////////////////////////////////////////

  std::string _collectionName;

  LogicalCollection* _collection;

  /// @brief index used for iteration
  std::shared_ptr<arangodb::Index> _index;

  std::unique_ptr<arangodb::IndexIterator> _cursor;

  // position of covering index attribute in the results
  size_t _coveringPosition;

  //////////////////////////////////////////////////////////////////////////////
  /// @brief Temporary builder for index search values
  ///        NOTE: Single search builder is NOT thread-safe
  //////////////////////////////////////////////////////////////////////////////

  aql::EdgeConditionBuilderContainer _searchBuilder;

  IndexIteratorOptions _indexIteratorOptions;

 public:
  EdgeCollectionInfo(ResourceMonitor& monitor, transaction::Methods* trx,
                     std::string const& cname);

  ////////////////////////////////////////////////////////////////////////////////
  /// @brief Get edges for the given direction and start vertex.
  ////////////////////////////////////////////////////////////////////////////////

  arangodb::IndexIterator* getEdges(std::string const&);

  transaction::Methods* trx() const { return _trx; }

  size_t coveringPosition() const noexcept { return _coveringPosition; }

  ////////////////////////////////////////////////////////////////////////////////
  /// @brief Return name of the wrapped collection
  ////////////////////////////////////////////////////////////////////////////////

  std::string const& getName() const;
};

}  // namespace traverser
}  // namespace arangodb
