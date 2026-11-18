CREATE DATABASE IF NOT EXISTS student_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_management;
CREATE TABLE IF NOT EXISTS students (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 student_code VARCHAR(20) NOT NULL UNIQUE,
 first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE, phone VARCHAR(20) NULL,
 gender ENUM('Male','Female','Other') NULL DEFAULT NULL,
 date_of_birth DATE NULL, status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS courses (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, course_code VARCHAR(20) NOT NULL UNIQUE,
 course_name VARCHAR(150) NOT NULL, description TEXT NULL,
 credits INT NOT NULL, CONSTRAINT valid_credits CHECK (credits BETWEEN 1 AND 30)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS enrollments (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, student_id INT UNSIGNED NOT NULL,
 course_id INT UNSIGNED NOT NULL, enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status ENUM('Enrolled','Completed','Dropped') NOT NULL DEFAULT 'Enrolled',
 UNIQUE KEY unique_enrollment(student_id,course_id),
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
INSERT IGNORE INTO students(student_code,first_name,last_name,email,phone,gender,date_of_birth,status) VALUES
 ('STU-001','Sophea','Chan','sophea@example.com','012345678','Female','2003-04-12','Active'),
 ('STU-002','Dara','Sok','dara@example.com','098765432','Male','2002-08-21','Active'),
 ('STU-003','Lina','Kim','lina@example.com','','Female','2004-01-17','Inactive');
INSERT IGNORE INTO courses(course_code,course_name,description,credits) VALUES
 ('CS101','Web Development','Build accessible websites with HTML, CSS and JavaScript.',3),
 ('DB201','Database Systems','Relational design, SQL and data integrity.',4),
 ('SE301','Software Engineering','Plan, build and test reliable software.',3);
INSERT IGNORE INTO enrollments(student_id,course_id,status)
 SELECT s.id,c.id,'Enrolled' FROM students s CROSS JOIN courses c WHERE s.student_code IN ('STU-001','STU-002') AND c.course_code='CS101';
