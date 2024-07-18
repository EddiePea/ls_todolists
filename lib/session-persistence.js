const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists, sortTodos } = require("./sort");
const nextId = require("./next-id");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    this.username = session.username;
    session.todoLists = this._todoLists;
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
  // Note that `todoListId` must be numeric.
  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    return deepCopy(todoList);
  }

  loadTodo (todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
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
  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  //Returns a copy of the list of todos in the indicated todo list ordered
  // by completion stations and title (case insensitive)
  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter(todo => !todo.done);
    let done = todos.filter(todo => todo.done);
    return deepCopy(sortTodos(undone, done));
  }

  //Toggle a todo between done and not done state. Returns true on success or
  //false if todo or list doesn't exist
  // id args must be numeric 
  toggleDoneTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) return false;

    todo.done = !todo.done;
    return true;
  }

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false; 

    let todoIndex = todoList.todos.findIndex(todo => todo.id = todoId);
    if (todoIndex === -1) return false;

    todoList.todos.splice(todoIndex, 1);    
    return true;
  }

  deleteTodoList(todoListId) {

    let todoListIndex = this._todoLists.findIndex(todoList => todoList.id = todoListId);
    if (todoListIndex === -1) return false;

    this._todoLists.splice(todoListIndex, 1);
    return true;
  }

  completeAllTodos(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.filter(todo => !todo.done).forEach(todo => (todo.done = true));
    return true;
  }

  createTodo(todoListId, title) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.push({
      title,
      id: nextId(),
      done: false,
    });

    return true;
  }

  setTodoListTitle(todoListId, todoListTitle) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.title = todoListTitle;
    return true;
  }

  todoListTitleExists(title) {
    return this._todoLists.some(todoList => todoList.title === title);
  }

  isUniqueConstraintViolation(_error) {
    return false;
  }

  createList(title) {

    let newList = {
      id: nextId(),
      title,
      todos: [],
    }

    this._todoLists.push(newList);
    return true;
  }

  //Returns a reference to the todo list with the indicated ID
  //Returns undefined if not found
  //todolistId must be numeric
  _findTodoList(todoListId) {
    return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

};