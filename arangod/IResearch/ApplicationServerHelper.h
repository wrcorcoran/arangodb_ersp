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
/// @author Andrey Abramov
/// @author Vasiliy Nabatchikov
////////////////////////////////////////////////////////////////////////////////

#pragma once

#include "ApplicationFeatures/ApplicationServer.h"

namespace arangodb {

namespace aql {

struct Function;
class AqlFunctionFeature;

}  // namespace aql

namespace iresearch {

bool addFunction(arangodb::aql::AqlFunctionFeature& functions,
                 arangodb::aql::Function const& function);

arangodb::aql::Function const* getFunction(
    arangodb::aql::AqlFunctionFeature& functions, std::string const& name);

// FIXME: remove this overload after C++20 and use heterogenious lookup in
// functions Feature
inline arangodb::aql::Function const* getFunction(
    arangodb::aql::AqlFunctionFeature& functions, std::string_view name) {
  return getFunction(functions, static_cast<std::string>(name));
}

}  // namespace iresearch
}  // namespace arangodb
