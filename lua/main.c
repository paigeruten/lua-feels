#include <emscripten.h>
#include <stdio.h>
#include <string.h>
#include "lua.h"
#include <lauxlib.h>
#include <lualib.h>

unsigned int feels_vm_delay = 100;
int feels_opcode_count = 0;

lua_State* init_lua() {
  lua_State* L = luaL_newstate();
  luaL_openlibs(L);
  return L;
}

void free_lua(lua_State* L) {
  lua_close(L);
}

void set_vm_delay(unsigned int milliseconds) {
  feels_vm_delay = milliseconds;
}

int run_lua(lua_State* L, const char* code) {
  feels_opcode_count = 0;

  lua_settop(L, 0);

  const char *retcode = lua_pushfstring(L, "return %s", code);
  int status = luaL_loadbuffer(L, retcode, strlen(retcode), "=stdin");
  if (status == LUA_OK) {
    lua_remove(L, -2);
  } else {
    lua_pop(L, 2);
    status = luaL_loadbuffer(L, code, strlen(code), "=stdin");
  }

  if (status == LUA_OK) {
    status = lua_pcall(L, 0, LUA_MULTRET, 1);
  }

  if (status == LUA_OK) {
    int n = lua_gettop(L);
    if (n > 0) {
      const char* value = luaL_tolstring(L, lua_gettop(L), NULL);
      EM_ASM({
        lua_event('result ' + UTF8ToString($0));
      }, value);
    }
  } else {
    const char *msg = lua_tostring(L, -1);
    EM_ASM({
      lua_event('error ' + UTF8ToString($0));
    }, msg);
    lua_pop(L, 1);
  }

  lua_settop(L, 0);

	return 0;
}
