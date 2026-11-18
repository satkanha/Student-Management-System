-- For the ORIGINAL generated schema only. Back up first using Navicat.
-- MySQL DDL commits implicitly. Preflight rejects values that would be lost.
-- No records are deleted or rewritten. Run once in Navicat as a complete script.
USE student_management;
DELIMITER $$
CREATE PROCEDURE sms_align_capstone_v1()
BEGIN
 IF EXISTS (SELECT 1 FROM students WHERE CHAR_LENGTH(student_code)>20 OR CHAR_LENGTH(email)>150 OR CHAR_LENGTH(phone)>20 OR gender='Prefer not to say')
 OR EXISTS (SELECT 1 FROM courses WHERE CHAR_LENGTH(course_code)>20) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Migration stopped: incompatible existing values. Export and review long codes/emails/phones or legacy gender values; no student data changed.';
 END IF;
 ALTER TABLE students
  MODIFY student_code VARCHAR(20) NOT NULL,
  MODIFY first_name VARCHAR(100) NOT NULL,
  MODIFY last_name VARCHAR(100) NOT NULL,
  MODIFY email VARCHAR(150) NOT NULL,
  MODIFY phone VARCHAR(20) NULL,
  MODIFY gender ENUM('Male','Female','Other') NULL DEFAULT NULL;
 ALTER TABLE courses
  MODIFY course_code VARCHAR(20) NOT NULL,
  MODIFY course_name VARCHAR(150) NOT NULL,
  MODIFY description TEXT NULL,
  MODIFY credits INT NOT NULL;
END$$
DELIMITER ;
CALL sms_align_capstone_v1();
DROP PROCEDURE sms_align_capstone_v1;
