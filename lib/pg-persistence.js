const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {

  constructor(session) {
    this.username = session.username;
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users WHERE username = $1";
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL = "UPDATE todos SET done = true WHERE todo_list_id = $1 AND NOT done AND username = $2";
    let result = await dbQuery(COMPLETE_ALL, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createTodo(todoListId, title) {
    const CREATE_TODO = "INSERT INTO todos (title, todo_list_id, username) VALUES ($1, $2, $3)";

    let result = await dbQuery(CREATE_TODO, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createList(title) {
    const CREATE_LIST = "INSERT INTO todolists (title, username) VALUES ($1, $2)";
    try {
      let result = await dbQuery(CREATE_LIST, title, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
  // Note that `todoListId` must be numeric.
  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1 AND username = $2";
    const FIND_TODOS = "SELECT * FROM todos WHERE todo_list_id = $1 AND username = $2";

    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId, this.username);
    let resultTodos = dbQuery(FIND_TODOS, todoListId, this.username);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    return todoList;
  }

  async loadTodo (todoListId, todoId) {

    const FIND_TODO = "SELECT * FROM todos WHERE todo_list_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    let todo = result.rows[0];
    
    if (!todo) return undefined;
    return todo;
  };

  // Are all of the todos in the list done? 
  // If the todo list has at least 1 todo and all marked done, then the list is done
  // Otherwise, it is undone
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  // If the todo list has any undone todos, it returns false
  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  //Return the list of todo lists sorted by completion status and title
  //case insensitive
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1 ORDER BY lower(title) ASC";
    const ALL_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(ALL_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodoLists || !allTodos) return undefined;

    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todo_list_id;
      })
    });

    return this._partitionTodoLists(allTodoLists);
  }

  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });
    return undone.concat(done);
  }

  //Returns a copy of the list of todos in the indicated todo list ordered
  // by completion stations and title (case insensitive)
  async sortedTodos(todoList) {
    const SORTED_TODOS = "SELECT * FROM todos WHERE todo_list_id = $1 AND username = $2 ORDER BY done ASC, lower(title) ASC";
    let resultTodos = await dbQuery(SORTED_TODOS, todoList.id, this.username);

    if (!resultTodos) return undefined;
    return resultTodos.rows;
  }

  //Toggle a todo between done and not done state. Returns true on success or
  //false if todo or list doesn't exist
  // id args must be numeric 
  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done WHERE todo_list_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(TOGGLE_DONE, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todo_list_id = $1 AND id = $2 AND username = $3";
    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  async setTodoListTitle(todoListId, todoListTitle) {
    const UPDATE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";
    let result = await dbQuery(UPDATE_TITLE, todoListTitle, todoListId, this.username);
    return result.rowCount > 0;
  }

  async todoListTitleExists(title) {
    const FIND_TODOLIST_TITLE = "SELECT * FROM todolists WHERE title = $1 AND username = $2";
    let result = await dbQuery(FIND_TODOLIST_TITLE, title, this.username);
    return result.rowCount > 0;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }
};