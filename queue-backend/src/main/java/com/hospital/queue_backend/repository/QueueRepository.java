package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long>{

    // ◄ මෙන්න මේ මෙතඩ් එකේ @Query එකයි parameters දෙකයි හරියටම මෙහෙම හදන්න මචන්:
    @Query("SELECT COALESCE(MAX(q.tokenNumber), 0) FROM Queue q WHERE q.doctor.id = :doctorId AND q.queueType = :queueType AND CAST(q.createdAt AS date) = CURRENT_DATE")
    int findMaxTokenNumberForToday(@Param("doctorId") Long doctorId, @Param("queueType") String queueType);

    // අද දවසේ, නිශ්චිත දොස්තර කෙනෙක්ගේ පෝලිමේ ඉන්න ඔක්කොම ලෙඩ්ඩුන්ගේ ලිස්ට් එක ගන්න
    @Query("SELECT q FROM Queue q WHERE q.doctor.id = :doctorId AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.tokenNumber ASC")
    List<Queue> findTodayQueueForDoctor(@Param("doctorId") Long doctorId);

    // අද දවසේ තවමත් පෝලිමේ ඉන්න (PENDING) ලෙඩ්ඩුන්ව ටයිප් එක අනුව විතරක් ගන්න (2:1 ලොජික් එකට ඕනේ වෙනවා)
    @Query("SELECT q FROM Queue q WHERE q.doctor.id = :doctorId AND q.queueType = :queueType AND q.status = 'PENDING' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.tokenNumber ASC")
    List<Queue> findPendingQueueByType(@Param("doctorId") Long doctorId, @Param("queueType") String queueType);

    // අද දවසේ ඇපෘවල් බලාපොරොත්තුවෙන් ඉන්න (PENDING_APPROVAL) ඔක්කොම ලෙඩ්ඩුන්ගේ ලිස්ට් එක ගැනීම
    @Query("SELECT q FROM Queue q WHERE q.status = 'PENDING_APPROVAL' AND CAST(q.createdAt AS date) = CURRENT_DATE ORDER BY q.id ASC")
    List<Queue> findTodayPendingApprovals();
}
