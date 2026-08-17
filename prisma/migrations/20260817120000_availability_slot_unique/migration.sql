-- Garante que só existe um slot por horário/tenant (evita reserva dupla no mesmo horário).
CREATE UNIQUE INDEX `AvailabilitySlot_tenantId_startsAt_key` ON `AvailabilitySlot`(`tenantId`, `startsAt`);
