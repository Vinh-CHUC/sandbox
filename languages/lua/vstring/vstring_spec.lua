require 'busted.runner'()
local VString = require("vstring.vstring")

describe("VString", function()
  it("Buildts", function()
      VString:new("Hello there")
  end)

  it("fails correctly", function()
      local str = VString:new("Hello there")
      assert.is.equal(str:get(), "Hello there")
  end)
end)
