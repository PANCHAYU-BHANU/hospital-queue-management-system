package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long> {

    // ◄ මෙන්න මේ මෙතඩ් එකේ @Query එකයි parameters දෙකයි හරියටම මෙහෙම හදන්න:
    @Query("SELECT COALESCE(MAX(q.tokenNumber), 0) FROM Queue q WHERE q.doctor.id = :doctorId AND q.status != 'REJECTED' AND CAST(q.createdAt AS date) = CURRENT_DATE")
    int findMaxTokenNumberForToday(@Param("doctorId") Long doctorId);

    // අද දවසේ, නිශ්චිත දොස්තර කෙනෙක්ගේ පෝලිමේ ඉන්න ඔක්කොම ලෙඩ්ඩුන්ගේ ලිස්ට් එක ගන්න
    @Query("SELECT q FROM Queue q WHERE q.doctor.id = :doctorId AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.tokenNumber ASC")
    List<Queue> findTodayQueueForDoctor(@Param("doctorId") Long doctorId);

    // අද දවසේ තවමත් පෝලිමේ ඉන්න (PENDING) ලෙඩ්ඩුන්ව ටයිප් එක අනුව විතරක් ගන්න (2:1
    // ලොජික් එකට ඕනේ වෙනවා)
    @Query("SELECT q FROM Queue q WHERE q.doctor.id = :doctorId AND q.queueType = :queueType AND q.status = 'PENDING' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.tokenNumber ASC")
    List<Queue> findPendingQueueByType(@Param("doctorId") Long doctorId, @Param("queueType") String queueType);

    // අද දවසේ ඇපෘවල් බලාපොරොත්තුවෙන් ඉන්න (PENDING_APPROVAL) ඔක්කොම ලෙඩ්ඩුන්ගේ
    // ලිස්ට් එක ගැනීම
    @Query("SELECT q FROM Queue q WHERE q.status = 'PENDING_APPROVAL' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.id ASC")
    List<Queue> findTodayPendingApprovals();

    // අද දවසේ COMPLETED වුණු අවසාන රෝගීන් 5 දෙනාගේ විස්තර (Average Wait Time ගණනයට)
    @Query("SELECT q FROM Queue q WHERE q.doctor.id = :doctorId AND q.status = 'COMPLETED' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.consultationEndTime DESC")
    List<Queue> findTop5CompletedToday(@Param("doctorId") Long doctorId,
            org.springframework.data.domain.Pageable pageable);

    // දොස්තර කෙනෙක්ගේ පෝලිමේ දැනට ඉන්න ගාන
    @Query("SELECT COUNT(q) FROM Queue q WHERE q.doctor.id = :doctorId AND (q.status = 'PENDING' OR q.status = 'CALLED' OR q.status = 'IN_CONSULTATION') AND CAST(q.createdAt AS date) = CURRENT_DATE")
    long countPendingQueueForDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT q FROM Queue q WHERE q.patient.user.id = :userId AND (q.status = 'PENDING' OR q.status = 'PENDING_APPROVAL' OR q.status = 'CALLED' OR q.status = 'IN_CONSULTATION' OR q.status = 'PHARMACY_QUEUE' OR q.status = 'PENDING_PAYMENT') AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.id DESC")
    List<Queue> findActiveQueueByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(q) FROM Queue q WHERE q.doctor.id = :doctorId AND q.queueType = 'NORMAL' AND (q.status = 'PENDING' OR q.status = 'CALLED' OR q.status = 'IN_CONSULTATION') AND q.tokenNumber < :tokenNumber AND CAST(q.createdAt AS date) = CURRENT_DATE")
    long countNormalPeopleAhead(@Param("doctorId") Long doctorId, @Param("tokenNumber") int tokenNumber);

    @Query("SELECT COUNT(q) FROM Queue q WHERE q.doctor.id = :doctorId AND q.queueType = 'PRIORITY' AND (q.status = 'PENDING' OR q.status = 'CALLED' OR q.status = 'IN_CONSULTATION') AND q.tokenNumber < :tokenNumber AND CAST(q.createdAt AS date) = CURRENT_DATE")
    long countPriorityPeopleAhead(@Param("doctorId") Long doctorId, @Param("tokenNumber") int tokenNumber);

    @Query("SELECT q FROM Queue q WHERE q.hospital.id = :hospitalId AND q.status = 'PHARMACY_QUEUE' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.consultationEndTime ASC")
    List<Queue> findPharmacyQueue(@Param("hospitalId") Long hospitalId);

    @Query("SELECT q FROM Queue q WHERE q.hospital.id = :hospitalId AND q.status = 'PENDING_PAYMENT' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.consultationEndTime ASC")
    List<Queue> findPendingPayments(@Param("hospitalId") Long hospitalId);

    List<Queue> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}
