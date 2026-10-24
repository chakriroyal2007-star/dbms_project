-- =============================================================================
-- TERA: Database Triggers and Audit Automation
-- Purpose: Enforce Data Integrity, Temporal History Archiving, and Status Sync
-- =============================================================================

-- 1. Trigger Function: Log Resource Quantity Changes to RESOURCE_HISTORY
CREATE OR REPLACE FUNCTION trg_fn_log_resource_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.available_quantity IS DISTINCT FROM NEW.available_quantity) THEN
        INSERT INTO resource_history (
            resource_history_id,
            resource_id,
            timestamp,
            quantity_available,
            change_amount,
            change_reason
        ) VALUES (
            CONCAT('RH_', MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)),
            NEW.resource_id,
            CURRENT_TIMESTAMP,
            NEW.available_quantity,
            (NEW.available_quantity - OLD.available_quantity),
            'Automatic trigger audit on resource quantity modification'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resource_history ON resource;
CREATE TRIGGER trg_resource_history
AFTER UPDATE ON resource
FOR EACH ROW
EXECUTE FUNCTION trg_fn_log_resource_history();

-- 2. Trigger Function: Sync Ambulance Status when Allocated or Released
CREATE OR REPLACE FUNCTION trg_fn_sync_ambulance_allocation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.resource_type = 'AMBULANCE') THEN
        IF (NEW.status = 'ACTIVE') THEN
            -- Update ambulance table current status
            UPDATE ambulance 
            SET current_status = 'DISPATCHED' 
            WHERE ambulance_id = NEW.resource_id;

            -- Insert new status history record
            INSERT INTO ambulance_status_history (
                status_history_id,
                ambulance_id,
                status,
                start_time,
                end_time,
                reason
            ) VALUES (
                CONCAT('ASH_', MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)),
                NEW.resource_id,
                'DISPATCHED',
                NEW.allocated_at,
                NULL,
                CONCAT('Dispatched to Incident ID: ', NEW.incident_id)
            );
        ELSIF (NEW.status IN ('COMPLETED', 'RELEASED', 'CANCELLED')) THEN
            UPDATE ambulance 
            SET current_status = 'AVAILABLE' 
            WHERE ambulance_id = NEW.resource_id;

            -- Close open status history record
            UPDATE ambulance_status_history
            SET end_time = COALESCE(NEW.released_at, CURRENT_TIMESTAMP)
            WHERE ambulance_id = NEW.resource_id AND end_time IS NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ambulance_alloc ON resource_allocation;
CREATE TRIGGER trg_sync_ambulance_alloc
AFTER INSERT OR UPDATE ON resource_allocation
FOR EACH ROW
EXECUTE FUNCTION trg_fn_sync_ambulance_allocation();
