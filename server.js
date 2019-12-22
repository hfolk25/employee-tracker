// Dependencies
// ====================================================
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "employee_db",
});

connection.connect(err => {
    if (err) throw err;
    selectAction();
});

const selectAction = () => {
  inquirer
    .prompt([
        {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
            "View all employees",
            "View all employees by department",
            // "View all employees by manager",
            "Add employee",
            "Remove employee",
            "Update employee role",
            // "Update employee manager",
            "View all roles",
            "Add role",
            "Remove role",
            "View departments",
            "Add department",
            "Remove department",
            "Exit"
        ]
        }
    ]).then(answer => {
        switch (answer.action) {
        case "View all employees":
            viewEmployees();
            break;
        
        case "View all employees by department":
            viewByDepartment();
            break;
        
        // case "View all employees by manager":
        //     managerView();
        //     break;
        
        case "Add employee":
            addEmployee();
            break;
        
        case "Remove employee":
            removeEmployee();
            break;
        
        case "Update employee role":
            updateRole();
            break;
        
        // case "Update employee manager":
        //     updateManager();
        //     break;
        
        case "View all roles":
            viewRoles();
            break;

        case "Add role":
            addRole();
            break;

        case "Remove role":
            removeRole();
            break;

        case "View departments":
            viewDepartments();
            break;

        case "Add department":
            addDepartment();
            break;

        case "Remove department":
            removeDepartment();
            break;

        case "Exit":
            connection.end();
            break;
        };
    });
};

// Format the response into a table
const makeEmployeeTable = response => {
    const employees = [];
    for (let i = 0; i < response.length; i++) {
        const employee = {};
        employee.id = response[i].id;
        employee.first_name = response[i].first_name;
        employee.last_name = response[i].last_name;
        employee.title = response[i].title;
        employee.department = response[i].department;
        employee.salary = response[i].salary;
        if (response[i].manager_id == null) {
            employee.manager = null;
        } else {
            for (let j = 0; j < response.length; j++) {
                if (response[j].id === response[i].manager_id) {
                    employee.manager = `${response[j].first_name} ${response[j].last_name}`;
                };
            };
        };
        employees.push(employee);
        };
    console.table(employees);
};

// View all employees
const viewEmployees = () => {
    const query = "SELECT Employees.id, first_name, last_name, title, department, salary, manager_id FROM ((Roles INNER JOIN Departments ON Roles.department_id = Departments.id) INNER JOIN Employees ON Employees.role_id = Roles.id) ORDER BY Employees.id ASC";
    connection.query(query, (err, res) => {
        if (err) throw err;
        makeEmployeeTable(res);
    });
}

// View all employees by department
const viewByDepartment = () => {
    const queryDepartment = "SELECT department FROM Departments";
    connection.query(queryDepartment, (err, res) => {
        if (err) throw err;
        const departments = [];
        for (let i = 0; i < res.length; i++) {
            departments.push(res[i].department);
        };
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "selectedDepartment",
                    message: "Which department would you like to view?",
                    choices: departments
                }
            ]).then(answer => {
                const query = "SELECT * FROM ((Roles INNER JOIN Departments ON Roles.department_id = Departments.id) INNER JOIN Employees ON Employees.role_id = Roles.id) WHERE department = ? ORDER BY Employees.id ASC";
                connection.query(query, [answer.selectedDepartment], (err, res) => {
                    makeEmployeeTable(res);
                });
            });
    });
};

// BONUS
// const managerView = () => {
    
// }

// Add an employee to the database
const addEmployee = () => {

    const queryGetRole = "SELECT * FROM Roles INNER JOIN Employees ON Roles.id = Employees.role_id";
    connection.query(queryGetRole, async (err, res) => {
        let roles = [];
        const employees = [];
        console.log(res);
        for (let i = 0; i < res.length; i++) {
            roles.push(res[i].title);
            const employee = `${res[i].first_name} ${res[i].last_name}`
            employees.push(employee);
        };
        const uniqueRoles = new Set(roles);
        roles = [...uniqueRoles];
        await inquirer
            .prompt([
                {
                    type: "input",
                    name: "addedEmployeeName",
                    message: "What is the employee's name?"
                },
                {
                    type: "list",
                    name: "addedEmployeeRole",
                    message: "What is their role?",
                    choices: roles
                },
                {
                    type: "list",
                    name: "addedEmployeeManager",
                    message: "Who is the employee's manager?",
                    choices: employees
                }
            ]).then(answer => {
                const employeeName = answer.addedEmployeeName.split(" ");
                const managerName = answer.addedEmployeeManager.split(" ");
                // From the user-inputted role, find the role id using Roles table, then insert into the next query
                const queryRoleId = "SELECT * FROM Roles INNER JOIN Employees ON Roles.id = Employees.role_id WHERE title = ? OR first_name = ? AND last_name = ?";
                connection.query(queryRoleId, [answer.addedEmployeeRole, managerName[0], managerName[1]], async (err, res) => {
                    if (err) throw err;
                    console.log(res);
                    let role_id = 0;
                    let manager_id = 0;
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].title === answer.addedEmployeeRole) {
                            role_id = res[i].role_id;
                        };
                        if (res[i].first_name === managerName[0] && res[i].last_name === managerName[1]) {
                            manager_id = res[i].id;
                        };
                    };
                    await insertEmployee(role_id, manager_id);
                });

                // Using the role id gained from the previous query, insert the employee with their first and last name and role id
                const insertEmployee = (role_id, manager_id) => {
                    const query = "INSERT INTO Employees (first_name, last_name, role_id) VALUES (?, ?, ?)";
                    connection.query(query, [employeeName[0], employeeName[1], role_id], async (err, result) => {
                        if (err) throw err;
                        await updateManager(manager_id);
                    });

                    const updateManager = manager_id => {
                        const updateManagerQuery = "UPDATE Employees SET manager_id = ? WHERE first_name = ? AND last_name = ?";
                        connection.query(updateManagerQuery, [manager_id, employeeName[0], employeeName[1]], (err, res) => {
                            if (err) throw err;
                            console.log("The employee was added successfully.");
                        });
                    };
                };
            });
    });
};

// BONUS
// Remove an employee
const removeEmployee = () => {
    const queryEmployees = "SELECT first_name, last_name FROM Employees";
    
    connection.query(queryEmployees, (err, res) => {
        if (err) throw err;
        const employees = [];
        for (let i = 0; i < res.length; i++) {
            const employee = `${res[i].first_name} ${res[i].last_name}`;
            employees.push(employee);
        };
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "removedEmployee",
                    message: "Which employee would you like to remove?",
                    choices: employees
                }
            ]).then(answer => {
                const employeeName = answer.removedEmployee.split(" ");
                const query = "DELETE FROM Employees WHERE first_name = ? AND last_name = ?";
                connection.query(query, [employeeName[0], employeeName[1]], (err, res) => {
                    if (err) throw err;
                    console.log("The employee was removed successfully.");
                });
            });
    });
};

// Update an employee role
const updateRole = () => {
    const queryEmployee = "SELECT * FROM Employees INNER JOIN Roles ON Employees.role_id = Roles.id ORDER BY Employees.id ASC";
    
    connection.query(queryEmployee, async (err, res) => {
        if (err) throw err;
        console.log(res);
        const employees = [];
        let roles = [];
        for (let i = 0; i < res.length; i++) {
            const employee = `${res[i].first_name} ${res[i].last_name}`;
            const role = res[i].title;
            employees.push(employee);
            roles.push(role);
        };
        const uniqueRoles = new Set(roles);
        roles = [...uniqueRoles];
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "employee",
                    message: "Which employee's role would you like to update?",
                    choices: employees
                },
                {
                    type: "list",
                    name: "role",
                    message: "What role you would like to update them to?",
                    choices: roles
                }
            ]).then(async answer => {
                let role_id = 0;
                for (let j = 0; j < res.length; j++) {
                    if (res[j].title === answer.role) {
                        role_id = res[j].role_id;
                    };
                };
                await update(answer.employee, role_id);
            });
    });

    // Update the employee's role
    const update = (employee, role_id) => {
        const employeeName = employee.split(" ");
        const query = "UPDATE Employees INNER JOIN Roles ON Employees.role_id = Roles.id SET role_id = ? WHERE first_name = ? AND last_name = ?";
        connection.query(query, [role_id, employeeName[0], employeeName[1]], (err, res) => {
            if (err) throw err;
            console.log("The employee's role was updated successfully.");
        });
    };
};

// BONUS
// const updateManager = () => {
    
// }

// View all roles
const viewRoles = () => {
    const query = "SELECT * FROM Roles";
    connection.query(query, (err, res) => {
        const roles = [];
        res.forEach(element => {
            const role = {};
            role.id = element.id;
            role.title = element.title;
            roles.push(role);
        });
        console.table(roles);
    });
};

// Adds a role
const addRole = () => {
    const queryDepartment = "SELECT * FROM Departments";
    connection.query(queryDepartment, (err, res) => {
        if (err) throw err;
        const departments = [];
        res.forEach(element => departments.push(element.department));
        inquirer
            .prompt([
                {
                    type: "input",
                    name: "newRole",
                    message: "What role would you like to add?"
                },
                {
                    type: "input",
                    name: "salary",
                    message: "What is the salary of this role?"
                },
                {
                    type: "list",
                    name: "department",
                    message: "Which department is it under?",
                    choices: departments
                }
            ]).then(answer => {
                let department_id = 0;
                res.forEach(element => {
                    if (element.department === answer.department) {
                        department_id = element.id;
                    };
                });
                const query = "INSERT INTO Roles (title, salary, department_id) VALUES (?, ?, ?)";
                const newRole = toProperCase(answer.newRole);
                const salary = parseInt(answer.salary);
                connection.query(query, [newRole, salary, department_id], (err, res) => {
                    if (err) throw err;
                    console.log("The role was added successfully.");
                });
            });
    })
    
};

// BONUS
// Removes chosen role
const removeRole = () => {
    const query = "SELECT * FROM Roles";
    connection.query(query, (err, res) => {
        if (err) throw err;
        const roles = [];
        res.forEach(element => roles.push(element.title));
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "removedRole",
                    message: "What role would you like to remove?",
                    choices: roles
                }
            ]).then(answer => {
                const query = "DELETE FROM Roles WHERE title = ?";
                connection.query(query, answer.removedRole, (err, res) => {
                    if (err) throw err;
                    console.log("The role was removed successfully.");
                });
            });
    })
}

// View all departments
const viewDepartments = () => {
    const query = "SELECT * FROM Departments";
    connection.query(query, (err, res) => {
        if (err) throw err;
        const departments = [];
        res.forEach(element => {
            const department = {};
            department.id = element.id;
            department.department = element.department;
            departments.push(department);
        });
        console.table(departments);
    });
}

// Adds a department
const addDepartment = () => {
    inquirer
        .prompt([
            {
                type: "input",
                name: "newDepartment",
                message: "What department would you like to add?"
            }
        ]).then(answer => {
            const query = "INSERT INTO Departments (department) VALUES (?)";
            const newDepartment = toProperCase(answer.newDepartment);
            connection.query(query, newDepartment, (err, res) => {
                if (err) throw err;
                console.log("The department was added successfully.");
            });
        });
    
};

// BONUS
// Removes chosen department
const removeDepartment = () => {
    const query = "SELECT * FROM Departments";
    connection.query(query, (err, res) => {
        if (err) throw err;
        const departments = [];
        res.forEach(element => departments.push(element.department));
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "removedDepartment",
                    message: "What department would you like to remove?",
                    choices: departments
                }
            ]).then(answer => {
                const query = "DELETE FROM Departments WHERE department = ?";
                connection.query(query, answer.removedDepartment, (err, res) => {
                    if (err) throw err;
                    console.log("The department was removed successfully.");
                });
            });
    });
};

// Proper case user-inputted names
function toProperCase(name) {
    var splitName = name.split(" ");
    for (var i = 0; i < splitName.length; i++) {
        splitName[i] = splitName[i].charAt(0).toUpperCase() + splitName[i].substr(1).toLowerCase();
        var properName = splitName.join(" ");
    };
    return properName;
};