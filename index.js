// ===================== Dependencies =====================
const inquirer = require("inquirer");
const logo = require("asciiart-logo");
const connection = require("./db/connection");
require("console.table");

const init = () => {
  const logoText = logo({ name: "Employee Manager" }).render();
  console.log(logoText);
  menu();
};

const menu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "View all departments",
        "View all roles",
        "View all employees",
        "Add a department",
        "Add a role",
        "Add an employee",
        "Update an employee's role",
        "Update an employee's manager",
        "View all employees by manager",
        "View all employees by department",
        "Remove a department",
        "Remove a role",
        "Remove an employee",
        "View total utilized budget of a department",
        "Exit",
      ],
    },
  ]);

  switch (action) {
    case "View all departments":
      viewAll(`SELECT * FROM departments`);
      break;
    case "View all roles":
      viewAll(`SELECT roles.id, roles.title, roles.salary, departments.department
      FROM roles
      RIGHT JOIN departments ON roles.department_id = departments.id`);
      break;
    case "View all employees":
      viewAll(`SELECT e.id, e.first_name, e.last_name, roles.title, departments.department, roles.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM departments
      RIGHT JOIN roles ON departments.id = roles.department_id
      RIGHT JOIN employees e ON e.role_id = roles.id
      LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.id ASC`);
      break;
    case "Add a department":
      addDepartment();
      break;
    case "Add a role":
      addRole();
      break;
    case "Add an employee":
      addEmployee();
      break;
    case "Update an employee's role":
      updateRole();
      break;
    case "Update an employee's manager":
      updateManager();
      break;
    case "View all employees by manager":
      viewByManager();
      break;
    case "View all employees by department":
      viewByDepartment();
      break;
    case "Remove a department":
      remove("department", getAllDepartments);
      break;
    case "Remove a role":
      remove("role", getAllRoles);
      break;
    case "Remove an employee":
      remove("employee", getAllEmployees);
      break;
    case "View total utilized budget of a department":
      viewBudget();
      break;
    default:
      connection.end();
  }
};

// ===================== Basic get all helper queries from database =====================
const getAllDepartments = async () => {
  const query = `SELECT * FROM departments`;
  const res = await connection.query(query);
  const departments = res.map((row) => {
    return {
      value: row.id,
      name: row.department,
    };
  });
  return departments;
};

const getAllRoles = async () => {
  const query = `SELECT * FROM roles`;
  const res = await connection.query(query);
  const roles = res.map((row) => {
    return {
      value: row.id,
      name: row.title,
    };
  });
  return roles;
};

const getAllEmployees = async () => {
  const query = `SELECT * FROM employees`;
  const res = await connection.query(query);
  const employees = res.map((row) => {
    return {
      value: row.id,
      name: `${row.first_name} ${row.last_name}`,
    };
  });
  return employees;
};

const getAllManagers = async () => {
  const query = `SELECT * FROM employees WHERE manager_id is null`;
  const res = await connection.query(query);
  const managers = res.map((row) => {
    return {
      value: row.id,
      name: `${row.first_name} ${row.last_name}`,
    };
  });
  return managers;
};

// ===================== View All Function =====================
const viewAll = async (query) => {
  try {
    const res = await connection.query(query);
    console.table(res);
    menu();
  } catch (err) {
    throw err;
  }
};

// ===================== Add Functions =====================
const addDepartment = async () => {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "department",
      message: "What department would you like to add?",
    },
  ]);
  add("department", answer);
};

const addRole = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "What role would you like to add?",
    },
    {
      type: "input",
      name: "salary",
      message: "What is the salary of this role?",
    },
    {
      type: "list",
      name: "department_id",
      message: "Which department is it under?",
      choices: await getAllDepartments(),
    },
  ]);
  add("role", answers);
};

const addEmployee = async () => {
  const { first_name, last_name, role_id, isManager } = await inquirer.prompt([
    {
      type: "input",
      name: "first_name",
      message: "What is the employee's first name?",
    },
    {
      type: "input",
      name: "last_name",
      message: "What is the employee's last name?",
    },
    {
      type: "list",
      name: "role_id",
      message: "What is their role?",
      choices: await getAllRoles(),
    },
    {
      type: "confirm",
      name: "isManager",
      message: "Is this employee a manager?",
    },
  ]);

  let manager_id;
  if (!isManager) {
    const answer = await inquirer.prompt({
      type: "list",
      name: "manager_id",
      message: "Who is the employee's manager?",
      choices: await getAllManagers(),
    });
    manager_id = answer.manager_id;
  } else {
    manager_id = null;
  }

  const employeeObj = {
    first_name,
    last_name,
    role_id,
    manager_id,
  };

  add("employee", employeeObj);
};

const add = async (table, answers) => {
  const query = `INSERT INTO ${table}s SET ?`;
  try {
    await connection.query(query, answers);
    console.log(`The ${table} was added successfully.`);
    menu();
  } catch (err) {
    throw err;
  }
};

// ===================== Update Functions =====================
const updateRole = async () => {
  const { id, role_id } = await inquirer.prompt([
    {
      type: "list",
      name: "id",
      message: "Which employee's role would you like to update?",
      choices: await getAllEmployees(),
    },
    {
      type: "list",
      name: "role_id",
      message: "What role you would like to update them to?",
      choices: await getAllRoles(),
    },
  ]);

  update("role", role_id, id);
};

const updateManager = async () => {
  const { id, isManager } = await inquirer.prompt([
    {
      type: "list",
      name: "id",
      message: "Which employee's manager would you like to update?",
      choices: await getAllEmployees(),
    },
    {
      type: "confirm",
      name: "isManager",
      message: "Is this employee becoming a manager?",
    },
  ]);

  let manager_id;
  if (!isManager) {
    const answer = await inquirer.prompt({
      type: "list",
      name: "manager_id",
      message: "What manager you would like to update them to?",
      choices: await getAllManagers(),
    });
    manager_id = answer.manager_id;
  } else {
    manager_id = null;
  }

  update("manager", manager_id, id);
};

const update = async (column, column_id, id) => {
  try {
    const query = `UPDATE employees SET ${column}_id = ? WHERE id = ?`;
    await connection.query(query, [column_id, id]);
    console.log(`The employee's ${column} was updated successfully.`);
    menu();
  } catch (err) {
    throw err;
  }
};

// ===================== View By Functions =====================
const viewByManager = async () => {
  const { manager_id } = await inquirer.prompt([
    {
      type: "list",
      name: "manager_id",
      message: "Which manager's employees would you like to view?",
      choices: await getAllManagers(),
    },
  ]);
  const query = `SELECT e.id, e.first_name, e.last_name, roles.title, departments.department, roles.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
           FROM departments LEFT JOIN roles ON departments.id = roles.department_id
           LEFT JOIN employees e ON e.role_id = roles.id
           LEFT JOIN employees m ON m.id = e.manager_id
           WHERE e.manager_id = ? ORDER BY e.id ASC`;
  try {
    const res = await connection.query(query, [manager_id]);
    res.length > 0
      ? console.table(res)
      : console.log("This manager does not have any employees!");

    menu();
  } catch (err) {
    throw err;
  }
};

const viewByDepartment = async () => {
  const { department_id } = await inquirer.prompt([
    {
      type: "list",
      name: "department_id",
      message: "Which department's employees would you like to view?",
      choices: await getAllDepartments(),
    },
  ]);
  const query = `SELECT e.id, e.first_name, e.last_name, roles.title, departments.department, roles.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
     FROM departments LEFT JOIN roles ON departments.id = roles.department_id
     LEFT JOIN employees e ON e.role_id = roles.id
     LEFT JOIN employees m ON m.id = e.manager_id
     WHERE roles.department_id = ? ORDER BY e.id ASC`;
  try {
    const res = await connection.query(query, [department_id]);
    console.table(res);
    menu();
  } catch (err) {
    throw err;
  }
};

// ===================== Remove Function =====================
const remove = async (table, getAllFunction) => {
  const { id } = await inquirer.prompt([
    {
      type: "list",
      name: "id",
      message: `Which ${table} would you like to remove?`,
      choices: await getAllFunction(),
    },
  ]);
  try {
    const query = `DELETE FROM ${table}s WHERE id = ?`;
    await connection.query(query, [id]);
    console.log(`The ${table} was removed successfully.`);
    menu();
  } catch (err) {
    throw err;
  }
};

// ===================== View Budget Function =====================
const viewBudget = async () => {
  const { department_id } = await inquirer.prompt({
    type: "list",
    name: "department_id",
    message: "Which department's budget would you like to view?",
    choices: await getAllDepartments(),
  });
  const query = `SELECT SUM(roles.salary) as total_utilized_budget
  FROM departments
  LEFT JOIN roles ON departments.id = roles.department_id
  LEFT JOIN employees e ON e.role_id = roles.id
  WHERE roles.department_id = ?`;
  try {
    const res = await connection.query(query, [department_id]);
    console.table(res);
    menu();
  } catch (err) {
    throw err;
  }
};

init();
