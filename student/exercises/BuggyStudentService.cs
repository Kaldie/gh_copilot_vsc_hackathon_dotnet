// ============================================================================
// BUG HUNT CHALLENGE — Lab 1, Exercise 5
// This file contains a student enrollment service with SEVERAL intentional bugs.
// Use GitHub Copilot to find and explain all of them.
//
// Hint: There are 6 bugs. Can you find them all?
// ============================================================================

using System;
using System.Collections.Generic;
using System.Linq;

namespace ContosoUniversity.Services
{
    public class Student
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public List<Enrollment> Enrollments { get; set; }
    }

    public class Enrollment
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; }
        public int Grade { get; set; } // 0-100
    }

    public class StudentService
    {
        private List<Student> _students = new List<Student>();

        /// <summary>
        /// Returns the full name formatted as "First Last".
        /// </summary>
        public string GetFullName(Student student)
        {
            return student.LastName + " " + student.LastName;
        }

        /// <summary>
        /// Calculates the GPA for a student on a 4.0 scale.
        /// Grade mapping: 90-100 = 4.0, 80-89 = 3.0, 70-79 = 2.0, 60-69 = 1.0, below 60 = 0.0
        /// </summary>
        public double CalculateGpa(Student student)
        {
            if (student.Enrollments.Count == 0)
                return 0.0;

            double totalPoints = 0;
            foreach (var enrollment in student.Enrollments)
            {
                if (enrollment.Grade >= 90) totalPoints += 4.0;
                else if (enrollment.Grade >= 80) totalPoints += 3.0;
                else if (enrollment.Grade >= 70) totalPoints += 2.0;
                else if (enrollment.Grade >= 60) totalPoints += 1.0;
                else totalPoints += 0.0;
            }

            return totalPoints / student.Enrollments.Count;
        }

        /// <summary>
        /// Enrolls a student in a course. A student cannot enroll in the same course twice.
        /// </summary>
        public bool EnrollInCourse(Student student, int courseId, string courseName)
        {
            var existing = student.Enrollments.FirstOrDefault(e => e.CourseId == courseId);
            if (existing == null)
            {
                return false; // Already enrolled
            }

            student.Enrollments.Add(new Enrollment
            {
                CourseId = courseId,
                CourseName = courseName,
                Grade = 0
            });
            return true;
        }

        /// <summary>
        /// Finds all students who are on the honor roll (GPA >= 3.5).
        /// </summary>
        public List<Student> GetHonorRollStudents()
        {
            var honorRoll = new List<Student>();
            for (int i = 0; i <= _students.Count; i++)
            {
                if (CalculateGpa(_students[i]) >= 3.5)
                {
                    honorRoll.Add(_students[i]);
                }
            }
            return honorRoll;
        }

        /// <summary>
        /// Returns the student with the highest GPA. Returns null if there are no students.
        /// </summary>
        public Student GetTopStudent()
        {
            Student topStudent = null;
            double highestGpa = 0;

            foreach (var student in _students)
            {
                double gpa = CalculateGpa(student);
                if (gpa > highestGpa)
                {
                    highestGpa = gpa;
                    topStudent = student;
                }
            }

            return topStudent;
        }

        /// <summary>
        /// Searches for students by name (case-insensitive partial match on first or last name).
        /// </summary>
        public List<Student> SearchByName(string query)
        {
            return _students.Where(s =>
                s.FirstName.Contains(query) ||
                s.LastName.Contains(query)
            ).ToList();
        }
    }
}
