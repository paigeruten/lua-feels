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

static int msghandler (lua_State *L) {
  const char *msg = lua_tostring(L, 1);
  if (msg == NULL) {  /* is error object not a string? */
    if (luaL_callmeta(L, 1, "__tostring") &&  /* does it have a metamethod */
        lua_type(L, -1) == LUA_TSTRING)  /* that produces a string? */
      return 1;  /* that is the message */
    else
      msg = lua_pushfstring(L, "(error object is a %s value)",
                               luaL_typename(L, 1));
  }
  luaL_traceback(L, L, msg, 1);  /* append a standard traceback */
  return 1;  /* return the traceback */
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
    lua_pushcfunction(L, msghandler);  /* push message handler */
    lua_insert(L, 1);  /* put it under function and args */

    status = lua_pcall(L, 0, LUA_MULTRET, 1);

    lua_remove(L, 1);  /* remove message handler from the stack */
  } else {
    EM_ASM({
      lua_event('parse_error');
    });
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
