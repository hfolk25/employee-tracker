USE employee_db;

INSERT INTO Departments (department)
VALUES
    ("Sales"),
    ("Engineering"),
    ("Finance"),
    ("Legal");

INSERT INTO Roles (title, salary, department_id)
VALUES
    ("Sales Lead", 100000, 1),
    ("Salesperson", 80000, 1),
    ("Lead Engineer", 150000, 2),
    ("Software Engineer", 120000, 2),
    ("Accountant", 125000, 3),
    ("Legal Team Lead", 250000, 4),
    ("Lawyer", 190000, 4);

INSERT INTO Employees (first_name, last_name, role_id)
VALUES
    ("John", "Doe", 1),
    ("Mike", "Chan", 2),
    ("Ashley", "Rodriguez", 3),
    ("Kevin", "Tupik", 4),
    ("Jane", "Smith", 5),
    ("Malia", "Brown", 5),
    ("Sarah", "Lourd", 6),
    ("Tom", "Allen", 7),
    ("Christian", "Eckenrode", 3),
    ("Tammer", "Galal", 4);

UPDATE Employees SET manager_id=3 WHERE first_name="John";
UPDATE Employees SET manager_id=1 WHERE first_name="Mike";
UPDATE Employees SET manager_id=3 WHERE first_name="Kevin";
UPDATE Employees SET manager_id=7 WHERE first_name="Tom";
UPDATE Employees SET manager_id=2 WHERE first_name="Christian";
UPDATE Employees SET manager_id=4 WHERE first_name="Tammer";