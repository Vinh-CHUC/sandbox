local VString = {}
-- __index handles property lookups that aren't in the instance table
VString.__index = VString

-- The ':' syntax implicitly passes 'self' as the first argument.
-- When calling VString:new(), 'self' is the VString table itself.
function VString:new(str)
    -- setmetatable links the instance to 'self' (VString) as its metatable.
    -- Since VString.__index = VString, the instance can access VString's methods.
    -- Note: If called on an instance (str:new()), 'self' becomes that instance,
    -- and lookups will fail unless that instance also has an __index.
    return setmetatable({value = str}, self)
end

function VString:get()
    -- Here 'self' is the specific instance (the table returned by :new())
    return self.value
end

function VString:print()
    -- 'self' refers to the instance the method was called on
    print(self.value)
end

return VString
