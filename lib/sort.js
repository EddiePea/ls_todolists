// Compare object titles alphabetically (case insensitive)
const compareByTitle = (itemA, itemB) => {
  let titleA = itemA.title.toLowerCase();
  console.log('This is titleA', titleA);
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

const sortItems = (undone, done) => {
  undone.sort(compareByTitle);
  done.sort(compareByTitle);
  return [].concat(undone, done);

}

module.exports = {
  // return the list of todo lists or todos sorted by completion status and title.
  // The uncompleted and completed todo lists or todos must be passed to the method via
  // the done and undone args 
  sortTodoLists: sortItems,
  sortTodos: sortItems,
};
