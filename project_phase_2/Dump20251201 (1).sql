-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (x86_64)
--
-- Host: 127.0.0.1    Database: jat_db
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '88911fd0-b049-11f0-acc4-24b316546602:1-104';

--
-- Table structure for table `ApplicationForm`
--

DROP TABLE IF EXISTS `ApplicationForm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ApplicationForm` (
  `ApplicationID` int NOT NULL AUTO_INCREMENT,
  `ApplicantID` int NOT NULL,
  `JobID` int NOT NULL,
  `Status` enum('Submitted','Under Review','Interview Scheduled','Offer','Rejected') NOT NULL,
  `AppliedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ApplicationID`),
  KEY `ApplicantID` (`ApplicantID`),
  KEY `JobID` (`JobID`),
  CONSTRAINT `applicationform_ibfk_1` FOREIGN KEY (`ApplicantID`) REFERENCES `JobApplicant` (`ApplicantID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applicationform_ibfk_2` FOREIGN KEY (`JobID`) REFERENCES `JobPosting` (`JobID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ApplicationForm`
--

LOCK TABLES `ApplicationForm` WRITE;
/*!40000 ALTER TABLE `ApplicationForm` DISABLE KEYS */;
INSERT INTO `ApplicationForm` VALUES (1,17,7,'Under Review','2025-10-23 15:57:18'),(2,11,1,'Submitted','2025-10-23 15:57:18'),(3,1,1,'Submitted','2025-10-23 15:57:18'),(4,14,4,'Offer','2025-10-23 15:57:18'),(5,16,6,'Submitted','2025-10-23 15:57:18'),(6,19,9,'Offer','2025-10-23 15:57:18'),(7,5,5,'Rejected','2025-10-23 15:57:18'),(8,8,8,'Interview Scheduled','2025-10-23 15:57:18'),(9,15,5,'Rejected','2025-10-23 15:57:18'),(10,13,3,'Interview Scheduled','2025-10-23 15:57:18'),(11,20,10,'Interview Scheduled','2025-10-23 15:57:18'),(12,9,9,'Offer','2025-10-23 15:57:18'),(13,12,2,'Under Review','2025-10-23 15:57:18'),(14,2,2,'Under Review','2025-10-23 15:57:18'),(15,10,10,'Rejected','2025-10-23 15:57:18'),(16,3,3,'Interview Scheduled','2025-10-23 15:57:18'),(17,4,4,'Offer','2025-10-23 15:57:18'),(19,7,7,'Under Review','2025-10-23 15:57:18'),(20,18,8,'Interview Scheduled','2025-10-23 15:57:18'),(21,25,10,'Interview Scheduled','2025-12-01 15:30:08'),(22,25,6,'Submitted','2025-12-01 16:59:56'),(23,25,8,'Submitted','2025-12-01 17:31:04');
/*!40000 ALTER TABLE `ApplicationForm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CandidateProfile`
--

DROP TABLE IF EXISTS `CandidateProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CandidateProfile` (
  `ProfileID` int NOT NULL AUTO_INCREMENT,
  `ApplicantID` int NOT NULL,
  `Location` varchar(120) DEFAULT NULL,
  `LinkedInURL` varchar(255) DEFAULT NULL,
  `PortfolioURL` varchar(255) DEFAULT NULL,
  `Summary` text,
  PRIMARY KEY (`ProfileID`),
  UNIQUE KEY `ApplicantID` (`ApplicantID`),
  CONSTRAINT `candidateprofile_ibfk_1` FOREIGN KEY (`ApplicantID`) REFERENCES `JobApplicant` (`ApplicantID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CandidateProfile`
--

LOCK TABLES `CandidateProfile` WRITE;
/*!40000 ALTER TABLE `CandidateProfile` DISABLE KEYS */;
INSERT INTO `CandidateProfile` VALUES (1,17,'City 17','https://www.linkedin.com/in/user17','https://portfolio.example.com/u17','Full-stack dev with interest in data.'),(2,11,'City 11','https://www.linkedin.com/in/user11','https://portfolio.example.com/u11','Full-stack dev with interest in data.'),(3,1,'City 1','https://www.linkedin.com/in/user1','https://portfolio.example.com/u1','Full-stack dev with interest in data.'),(4,14,'City 14','https://www.linkedin.com/in/user14','https://portfolio.example.com/u14','Full-stack dev with interest in data.'),(5,16,'City 16','https://www.linkedin.com/in/user16','https://portfolio.example.com/u16','Full-stack dev with interest in data.'),(6,19,'City 19','https://www.linkedin.com/in/user19','https://portfolio.example.com/u19','Full-stack dev with interest in data.'),(7,5,'City 5','https://www.linkedin.com/in/user5','https://portfolio.example.com/u5','Full-stack dev with interest in data.'),(8,8,'City 8','https://www.linkedin.com/in/user8','https://portfolio.example.com/u8','Full-stack dev with interest in data.'),(9,15,'City 15','https://www.linkedin.com/in/user15','https://portfolio.example.com/u15','Full-stack dev with interest in data.'),(10,13,'City 13','https://www.linkedin.com/in/user13','https://portfolio.example.com/u13','Full-stack dev with interest in data.'),(11,20,'City 20','https://www.linkedin.com/in/user20','https://portfolio.example.com/u20','Full-stack dev with interest in data.'),(12,9,'City 9','https://www.linkedin.com/in/user9','https://portfolio.example.com/u9','Full-stack dev with interest in data.'),(13,12,'City 12','https://www.linkedin.com/in/user12','https://portfolio.example.com/u12','Full-stack dev with interest in data.'),(14,2,'City 2','https://www.linkedin.com/in/user2','https://portfolio.example.com/u2','Full-stack dev with interest in data.'),(15,10,'City 10','https://www.linkedin.com/in/user10','https://portfolio.example.com/u10','Full-stack dev with interest in data.'),(16,3,'City 3','https://www.linkedin.com/in/user3','https://portfolio.example.com/u3','Full-stack dev with interest in data.'),(17,4,'City 4','https://www.linkedin.com/in/user4','https://portfolio.example.com/u4','Full-stack dev with interest in data.'),(18,6,'City 6','https://www.linkedin.com/in/user6','https://portfolio.example.com/u6','Full-stack dev with interest in data.'),(19,7,'City 7','https://www.linkedin.com/in/user7','https://portfolio.example.com/u7','Full-stack dev with interest in data.'),(20,18,'City 18','https://www.linkedin.com/in/user18','https://portfolio.example.com/u18','Full-stack dev with interest in data.'),(21,25,'Cary, NC','https://linkedin.com/in/nealsshah','https://github.com/nealsshah',NULL);
/*!40000 ALTER TABLE `CandidateProfile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FeedbackForm`
--

DROP TABLE IF EXISTS `FeedbackForm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FeedbackForm` (
  `FeedbackID` int NOT NULL AUTO_INCREMENT,
  `InterviewID` int NOT NULL,
  `InterviewerID` int NOT NULL,
  `Rating` tinyint NOT NULL,
  `Comments` text,
  `SubmittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FeedbackID`),
  KEY `InterviewID` (`InterviewID`),
  KEY `InterviewerID` (`InterviewerID`),
  CONSTRAINT `feedbackform_ibfk_1` FOREIGN KEY (`InterviewID`) REFERENCES `InterviewSchedule` (`InterviewID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `feedbackform_ibfk_2` FOREIGN KEY (`InterviewerID`) REFERENCES `Interviewer` (`InterviewerID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `feedbackform_chk_1` CHECK ((`Rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FeedbackForm`
--

LOCK TABLES `FeedbackForm` WRITE;
/*!40000 ALTER TABLE `FeedbackForm` DISABLE KEYS */;
INSERT INTO `FeedbackForm` VALUES (1,1,1,1,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(2,2,2,2,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(3,3,3,3,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(4,4,4,4,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(5,5,5,5,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(6,6,1,1,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(7,7,2,2,'Good communication; solid fundamentals.','2025-10-23 15:57:18'),(8,8,3,3,'Good communication; solid fundamentals.','2025-10-23 15:57:18');
/*!40000 ALTER TABLE `FeedbackForm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Interviewer`
--

DROP TABLE IF EXISTS `Interviewer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Interviewer` (
  `InterviewerID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(120) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Department` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`InterviewerID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Interviewer`
--

LOCK TABLES `Interviewer` WRITE;
/*!40000 ALTER TABLE `Interviewer` DISABLE KEYS */;
INSERT INTO `Interviewer` VALUES (1,'Priya Shah','priyaa@corp.com','Eng'),(2,'Diego Alvarez','diego@corp.com','Data'),(3,'Taylor Brooks','taylor@corp.com','Product'),(4,'Chen Li','chen.li@corp.com','Eng'),(5,'Fatima Ali','fatima@corp.com','Design');
/*!40000 ALTER TABLE `Interviewer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InterviewSchedule`
--

DROP TABLE IF EXISTS `InterviewSchedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `InterviewSchedule` (
  `InterviewID` int NOT NULL AUTO_INCREMENT,
  `ApplicationID` int NOT NULL,
  `InterviewDateTime` datetime NOT NULL,
  `Mode` enum('Onsite','Remote','Phone') NOT NULL,
  `RoundNumber` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`InterviewID`),
  KEY `ApplicationID` (`ApplicationID`),
  CONSTRAINT `interviewschedule_ibfk_1` FOREIGN KEY (`ApplicationID`) REFERENCES `ApplicationForm` (`ApplicationID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InterviewSchedule`
--

LOCK TABLES `InterviewSchedule` WRITE;
/*!40000 ALTER TABLE `InterviewSchedule` DISABLE KEYS */;
INSERT INTO `InterviewSchedule` VALUES (1,4,'2025-10-27 15:57:18','Onsite',1),(2,6,'2025-10-29 15:57:18','Phone',1),(3,8,'2025-10-31 15:57:18','Remote',1),(4,10,'2025-11-02 15:57:18','Onsite',1),(5,12,'2025-11-04 15:57:18','Phone',1),(6,16,'2025-11-08 15:57:18','Onsite',1),(7,17,'2025-11-09 15:57:18','Remote',1),(8,20,'2025-11-12 15:57:18','Remote',1),(10,21,'2025-12-01 14:00:00','Remote',1),(11,11,'2025-12-02 14:00:00','Remote',1);
/*!40000 ALTER TABLE `InterviewSchedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `JobApplicant`
--

DROP TABLE IF EXISTS `JobApplicant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `JobApplicant` (
  `ApplicantID` int NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(80) NOT NULL,
  `LastName` varchar(80) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Phone` varchar(30) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ApplicantID`),
  UNIQUE KEY `Email` (`Email`),
  CONSTRAINT `jobapplicant_chk_1` CHECK ((`Email` like _utf8mb4'%@%._%'))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `JobApplicant`
--

LOCK TABLES `JobApplicant` WRITE;
/*!40000 ALTER TABLE `JobApplicant` DISABLE KEYS */;
INSERT INTO `JobApplicant` VALUES (1,'Ava','Nguyen','ava.nguyen@example.com','555-1000','2025-10-23 15:57:18'),(2,'Liam','Patel','liam.patel@example.com','555-1001','2025-10-23 15:57:18'),(3,'Mia','Johnson','mia.j@example.com','555-1002','2025-10-23 15:57:18'),(4,'Noah','Brown','noah.brown@example.com','555-1003','2025-10-23 15:57:18'),(5,'Emma','Garcia','emma.g@example.com','555-1004','2025-10-23 15:57:18'),(6,'Oliver','Davis','oliver.d@example.com','555-1005','2025-10-23 15:57:18'),(7,'Sophia','Wilson','sophia.w@example.com','555-1006','2025-10-23 15:57:18'),(8,'Ethan','Martinez','ethan.m@example.com','555-1007','2025-10-23 15:57:18'),(9,'Isabella','Anderson','isa.a@example.com','555-1008','2025-10-23 15:57:18'),(10,'Lucas','Thomas','lucas.t@example.com','555-1009','2025-10-23 15:57:18'),(11,'Amelia','Moore','amelia.m@example.com','555-1010','2025-10-23 15:57:18'),(12,'James','Taylor','james.t@example.com','555-1011','2025-10-23 15:57:18'),(13,'Harper','Lee','harper.lee@example.com','555-1012','2025-10-23 15:57:18'),(14,'Benjamin','Harris','ben.h@example.com','555-1013','2025-10-23 15:57:18'),(15,'Evelyn','Clark','evelyn.c@example.com','555-1014','2025-10-23 15:57:18'),(16,'Elijah','Lewis','elijah.l@example.com','555-1015','2025-10-23 15:57:18'),(17,'Abigail','Robinson','abigail.r@example.com','555-1016','2025-10-23 15:57:18'),(18,'William','Walker','william.w@example.com','555-1017','2025-10-23 15:57:18'),(19,'Emily','Young','emily.y@example.com','555-1018','2025-10-23 15:57:18'),(20,'Henry','King','henry.k@example.com','555-1019','2025-10-23 15:57:18'),(25,'Neal','Shah','nealshah@vt.edu','9196562104','2025-12-01 15:30:05');
/*!40000 ALTER TABLE `JobApplicant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `JobPosting`
--

DROP TABLE IF EXISTS `JobPosting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `JobPosting` (
  `JobID` int NOT NULL AUTO_INCREMENT,
  `RecruiterID` int NOT NULL,
  `Title` varchar(160) NOT NULL,
  `Department` varchar(120) DEFAULT NULL,
  `Location` varchar(120) DEFAULT NULL,
  `EmploymentType` enum('Full-time','Part-time','Intern','Contract') NOT NULL,
  `PostedDate` date NOT NULL,
  `Status` enum('Open','Closed','On Hold') NOT NULL DEFAULT 'Open',
  PRIMARY KEY (`JobID`),
  KEY `RecruiterID` (`RecruiterID`),
  CONSTRAINT `jobposting_ibfk_1` FOREIGN KEY (`RecruiterID`) REFERENCES `Recruiter` (`RecruiterID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `JobPosting`
--

LOCK TABLES `JobPosting` WRITE;
/*!40000 ALTER TABLE `JobPosting` DISABLE KEYS */;
INSERT INTO `JobPosting` VALUES (1,1,'Software Engineer I','Eng','NYC','Full-time','2025-09-01','Open'),(2,1,'Data Analyst','Data','Remote','Full-time','2025-09-03','Open'),(3,2,'Frontend Intern','Eng','Remote','Intern','2025-09-05','Open'),(4,2,'Product Manager','Product','Austin','Full-time','2025-09-07','Open'),(5,3,'QA Engineer','Eng','NYC','Full-time','2025-09-08','On Hold'),(6,3,'DevOps Engineer','Eng','Remote','Full-time','2025-09-10','Open'),(7,1,'UX Designer','Design','SF','Full-time','2025-09-11','Open'),(8,2,'Data Engineer','Data','Remote','Full-time','2025-09-12','Open'),(9,3,'Support Specialist','Ops','Remote','Full-time','2025-09-14','Closed'),(10,1,'Mobile Engineer','Eng','Miami','Full-time','2025-09-15','Open');
/*!40000 ALTER TABLE `JobPosting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Manager`
--

DROP TABLE IF EXISTS `Manager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Manager` (
  `ManagerID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(120) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Department` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`ManagerID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Manager`
--

LOCK TABLES `Manager` WRITE;
/*!40000 ALTER TABLE `Manager` DISABLE KEYS */;
/*!40000 ALTER TABLE `Manager` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Recruiter`
--

DROP TABLE IF EXISTS `Recruiter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Recruiter` (
  `RecruiterID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(120) NOT NULL,
  `Email` varchar(255) NOT NULL,
  PRIMARY KEY (`RecruiterID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Recruiter`
--

LOCK TABLES `Recruiter` WRITE;
/*!40000 ALTER TABLE `Recruiter` DISABLE KEYS */;
INSERT INTO `Recruiter` VALUES (1,'Riley Carter','recruiter1@corp.com'),(2,'Jordan Kim','recruiter2@corp.com'),(3,'Casey Morgan','recruiter3@corp.com'),(4,'peal','peal');
/*!40000 ALTER TABLE `Recruiter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Resume`
--

DROP TABLE IF EXISTS `Resume`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Resume` (
  `ResumeID` int NOT NULL AUTO_INCREMENT,
  `ApplicantID` int NOT NULL,
  `FileURL` varchar(255) NOT NULL,
  `UploadedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ResumeID`),
  KEY `ApplicantID` (`ApplicantID`),
  CONSTRAINT `resume_ibfk_1` FOREIGN KEY (`ApplicantID`) REFERENCES `JobApplicant` (`ApplicantID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Resume`
--

LOCK TABLES `Resume` WRITE;
/*!40000 ALTER TABLE `Resume` DISABLE KEYS */;
INSERT INTO `Resume` VALUES (1,17,'https://files.example.com/resume_17.pdf','2025-10-23 15:57:18',1),(2,11,'https://files.example.com/resume_11.pdf','2025-10-23 15:57:18',1),(3,1,'https://files.example.com/resume_1.pdf','2025-10-23 15:57:18',1),(4,14,'https://files.example.com/resume_14.pdf','2025-10-23 15:57:18',1),(5,16,'https://files.example.com/resume_16.pdf','2025-10-23 15:57:18',1),(6,19,'https://files.example.com/resume_19.pdf','2025-10-23 15:57:18',1),(7,5,'https://files.example.com/resume_5.pdf','2025-10-23 15:57:18',1),(8,8,'https://files.example.com/resume_8.pdf','2025-10-23 15:57:18',1),(9,15,'https://files.example.com/resume_15.pdf','2025-10-23 15:57:18',1),(10,13,'https://files.example.com/resume_13.pdf','2025-10-23 15:57:18',1),(11,20,'https://files.example.com/resume_20.pdf','2025-10-23 15:57:18',1),(12,9,'https://files.example.com/resume_9.pdf','2025-10-23 15:57:18',1),(13,12,'https://files.example.com/resume_12.pdf','2025-10-23 15:57:18',1),(14,2,'https://files.example.com/resume_2.pdf','2025-10-23 15:57:18',1),(15,10,'https://files.example.com/resume_10.pdf','2025-10-23 15:57:18',1),(16,3,'https://files.example.com/resume_3.pdf','2025-10-23 15:57:18',1),(17,4,'https://files.example.com/resume_4.pdf','2025-10-23 15:57:18',1),(18,6,'https://files.example.com/resume_6.pdf','2025-10-23 15:57:18',1),(19,7,'https://files.example.com/resume_7.pdf','2025-10-23 15:57:18',1),(20,18,'https://files.example.com/resume_18.pdf','2025-10-23 15:57:18',1);
/*!40000 ALTER TABLE `Resume` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `StatusUpdate`
--

DROP TABLE IF EXISTS `StatusUpdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `StatusUpdate` (
  `UpdateID` int NOT NULL AUTO_INCREMENT,
  `ApplicationID` int NOT NULL,
  `OldStatus` enum('Submitted','Under Review','Interview Scheduled','Offer','Rejected') DEFAULT NULL,
  `NewStatus` enum('Submitted','Under Review','Interview Scheduled','Offer','Rejected') NOT NULL,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`UpdateID`),
  KEY `ApplicationID` (`ApplicationID`),
  CONSTRAINT `statusupdate_ibfk_1` FOREIGN KEY (`ApplicationID`) REFERENCES `ApplicationForm` (`ApplicationID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `StatusUpdate`
--

LOCK TABLES `StatusUpdate` WRITE;
/*!40000 ALTER TABLE `StatusUpdate` DISABLE KEYS */;
INSERT INTO `StatusUpdate` VALUES (1,1,'Submitted','Under Review','2025-10-23 15:57:18','Auto transition for seed data'),(2,2,'Submitted','Submitted','2025-10-23 15:57:18','Auto transition for seed data'),(3,3,'Submitted','Submitted','2025-10-23 15:57:18','Auto transition for seed data'),(4,4,'Submitted','Offer','2025-10-23 15:57:18','Auto transition for seed data'),(5,5,'Submitted','Submitted','2025-10-23 15:57:18','Auto transition for seed data'),(6,6,'Submitted','Offer','2025-10-23 15:57:18','Auto transition for seed data'),(7,7,'Submitted','Rejected','2025-10-23 15:57:18','Auto transition for seed data'),(8,8,'Submitted','Interview Scheduled','2025-10-23 15:57:18','Auto transition for seed data'),(9,9,'Submitted','Rejected','2025-10-23 15:57:18','Auto transition for seed data'),(10,10,'Submitted','Interview Scheduled','2025-10-23 15:57:18','Auto transition for seed data'),(11,11,'Submitted','Rejected','2025-10-23 15:57:18','Auto transition for seed data'),(12,12,'Submitted','Offer','2025-10-23 15:57:18','Auto transition for seed data'),(13,13,'Submitted','Under Review','2025-10-23 15:57:18','Auto transition for seed data'),(14,14,'Submitted','Under Review','2025-10-23 15:57:18','Auto transition for seed data'),(15,15,'Submitted','Rejected','2025-10-23 15:57:18','Auto transition for seed data'),(16,16,'Submitted','Interview Scheduled','2025-10-23 15:57:18','Auto transition for seed data'),(17,17,'Submitted','Offer','2025-10-23 15:57:18','Auto transition for seed data'),(19,19,'Submitted','Under Review','2025-10-23 15:57:18','Auto transition for seed data'),(20,20,'Submitted','Interview Scheduled','2025-10-23 15:57:18','Auto transition for seed data'),(21,21,'Submitted','Interview Scheduled','2025-12-01 17:06:10','Status changed to Interview Scheduled'),(22,21,'Interview Scheduled','Submitted','2025-12-01 17:09:21','Status changed to Submitted'),(23,21,'Submitted','Offer','2025-12-01 17:09:23','Status changed to Offer'),(24,21,'Interview Scheduled','Submitted','2025-12-01 17:24:33','Status changed to Submitted'),(25,21,'Submitted','Submitted','2025-12-01 17:24:34','Status changed to Submitted'),(26,21,'Submitted','Submitted','2025-12-01 17:24:35','Status changed to Submitted'),(27,21,'Submitted','Submitted','2025-12-01 17:27:19','Status changed to Submitted');
/*!40000 ALTER TABLE `StatusUpdate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) NOT NULL,
  `PasswordHash` varchar(64) NOT NULL,
  `UserType` enum('Admin','JobApplicant','Recruiter','Interviewer','HiringManager') NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'admin','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','Admin','2025-12-01 14:52:49'),(2,'applicantNeal','75b91423301a87da8168415887de5eab3623944f35de37d9272b6b6054ee831f','JobApplicant','2025-12-01 14:54:38'),(3,'applicantNeal2','0c371b8522bd9854545f1e771cb4e28a8035ac4d4f2fd2a67818fd9e43c36bc9','JobApplicant','2025-12-01 14:55:15'),(4,'nealshah','$2a$10$v3WGgm.XyNOMBAEklHfmAuxozE0YY7kHtC5T/dceDRDqwjrwzYviO','JobApplicant','2025-12-01 15:25:06'),(5,'peal','$2a$10$zuqasKlQNEWyFztHAFEU2OJs/P4Uc/rayN21KctB.djastjaSmbqe','Recruiter','2025-12-01 15:26:01'),(6,'ns','$2a$10$3VvlE4sQG9wqOidxbRyHTO7q3eeg/GtEkn7nzpvIJcvOUqZuTLBSS','JobApplicant','2025-12-01 17:30:49');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-01 17:34:56
