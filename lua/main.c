#include <stdio.h>
#include "lua.h"
#include <lauxlib.h>
#include <lualib.h>

lua_State* init_lua() {
    lua_State* L = luaL_newstate();
    luaL_openlibs(L);
    return L;
}

void free_lua(lua_State* L) {
    lua_close(L);
}

int run_lua(lua_State* L, const char* script) {
	int res = luaL_dostring(L, script);

	size_t len = 0;
	const char* value = lua_tolstring(L, lua_gettop(L), &len);

	printf("%s\n", value);

	return 0;
}
