DROP DATABASE IF EXISTS employee_db;

CREATE DATABASE employee_db;

USE employee_db;

CREATE TABLE Departments (
    id INT NOT NULL AUTO_INCREMENT,
    department VARCHAR(30) NOT NULL,
    primary key (id)
);

CREATE TABLE Roles (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL(9, 2) NOT NULL,
    department_id INT NOT NULL,
    primary key (id),
    foreign key (department_id) REFERENCES Departments(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Employees (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT NOT NULL,
    manager_id INT NULL,
    primary key (id),
    foreign key (role_id) REFERENCES Roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    foreign key (manager_id) REFERENCES Employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);