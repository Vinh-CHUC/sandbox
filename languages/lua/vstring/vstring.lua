local VString = {}
VString.__index = VString

function VString:new(str)
    return setmetatable({value = str}, self)
end

function VString:get()
    return self.value
end

function VString:print()
    print(self.value)
end

return VString
