package com.pos.fishchips.repository;

import com.pos.fishchips.entity.PosOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<PosOrder, UUID> {

    // JOIN FETCH to avoid N+1 under high load
    @Query("SELECT DISTINCT o FROM PosOrder o JOIN FETCH o.items i JOIN FETCH i.menuItem " +
           "WHERE o.eventDay.id = :dayId AND o.status != 'COMPLETED' ORDER BY o.ticketNumber ASC")
    List<PosOrder> findActiveByEventDay(@Param("dayId") UUID dayId);

    @Query("SELECT DISTINCT o FROM PosOrder o JOIN FETCH o.items i JOIN FETCH i.menuItem " +
           "WHERE o.eventDay.id = :dayId ORDER BY o.ticketNumber ASC")
    List<PosOrder> findAllByEventDay(@Param("dayId") UUID dayId);

    @Query("SELECT DISTINCT o FROM PosOrder o JOIN FETCH o.items i JOIN FETCH i.menuItem " +
           "WHERE o.eventDay.id = :dayId AND o.stationProfile.name IN :stationNames " +
           "ORDER BY o.ticketNumber ASC")
    List<PosOrder> findByEventDayAndStations(
            @Param("dayId") UUID dayId,
            @Param("stationNames") List<String> stationNames);

    @Query(value = "SELECT next_ticket_number(:dayId)", nativeQuery = true)
    Integer getNextTicketNumber(@Param("dayId") UUID dayId);

    @Query("SELECT HOUR(o.createdAt) as hour, COUNT(o) as count " +
           "FROM PosOrder o WHERE o.eventDay.id = :dayId GROUP BY HOUR(o.createdAt)")
    List<Object[]> countOrdersByHour(@Param("dayId") UUID dayId);

    @Query(value =
           "SELECT EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Vancouver') as hour, COUNT(*) as count " +
           "FROM orders o WHERE o.event_day_id = :dayId GROUP BY hour ORDER BY hour",
           nativeQuery = true)
    List<Object[]> countOrdersByHourNative(@Param("dayId") UUID dayId);

    @Query(value =
           "SELECT sp.name as station, COUNT(o.id) as order_count, COALESCE(SUM(o.total_price), 0) as revenue " +
           "FROM orders o JOIN station_profiles sp ON sp.id = o.station_profile_id " +
           "WHERE o.event_day_id = :dayId GROUP BY sp.name",
           nativeQuery = true)
    List<Object[]> revenueByStation(@Param("dayId") UUID dayId);

    @Query(value =
           "SELECT mic.component_name, SUM(oi.quantity * mic.component_quantity) as total " +
           "FROM order_items oi " +
           "JOIN menu_item_components mic ON mic.menu_item_id = oi.menu_item_id " +
           "JOIN orders o ON o.id = oi.order_id " +
           "WHERE o.event_day_id = :dayId " +
           "GROUP BY mic.component_name ORDER BY total DESC",
           nativeQuery = true)
    List<Object[]> componentCountsByEventDay(@Param("dayId") UUID dayId);
}
