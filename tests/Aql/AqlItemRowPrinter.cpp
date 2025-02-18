////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2020 ArangoDB GmbH, Cologne, Germany
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
/// @author Tobias Gödderz
////////////////////////////////////////////////////////////////////////////////

#include "AqlItemRowPrinter.h"

#include "Aql/AqlItemBlockManager.h"
#include "Aql/InputAqlItemRow.h"
#include "Aql/ShadowAqlItemRow.h"
#include "Basics/GlobalResourceMonitor.h"
#include "Basics/ResourceUsage.h"

#include <velocypack/Slice.h>

using namespace arangodb;
using namespace arangodb::aql;

template<class RowType, class>
std::ostream& arangodb::aql::operator<<(std::ostream& stream,
                                        RowType const& row) {
  constexpr bool isInputRow = std::is_same<RowType, InputAqlItemRow>::value;
  static_assert(isInputRow || std::is_same<RowType, ShadowAqlItemRow>::value,
                "RowType must be one of InputAqlItemRow or ShadowAqlItemRow");

  if (!row.isInitialized()) {
    if (isInputRow) {
      return stream << "InvalidInputRow{}";
    } else {
      return stream << "InvalidShadowRow{}";
    }
  }

  arangodb::GlobalResourceMonitor global{};
  arangodb::ResourceMonitor monitor{global};
  auto manager = AqlItemBlockManager{monitor};

  struct {
    void operator()(std::ostream& stream, InputAqlItemRow const&) {
      stream << "InputRow";
    };
    void operator()(std::ostream& stream, ShadowAqlItemRow const& row) {
      stream << "ShadowRow(" << row.getDepth() << ")";
    };
  } printHead;
  printHead(stream, row);

  stream << "{";
  if (row.getNumRegisters() > 0) {
    stream << row.getValue(0).slice().toJson();
  }
  for (RegisterId::value_t i = 1; i < row.getNumRegisters(); ++i) {
    stream << ", ";
    stream << row.getValue(i).slice().toJson();
  }
  stream << "}";
  return stream;
}

template std::ostream& arangodb::aql::operator<<<InputAqlItemRow>(
    std::ostream& stream, InputAqlItemRow const& row);
template std::ostream& arangodb::aql::operator<<<ShadowAqlItemRow>(
    std::ostream& stream, ShadowAqlItemRow const& row);
