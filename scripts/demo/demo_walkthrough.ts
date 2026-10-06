import { query, pool } from '../../apps/api/src/config/db.js';

async function printDemoWalkthrough() {
  console.log(`
================================================================================
                    GEODHARA - DEMO SYSTEM WALKTHROUGH
   "An Integrated GIS-based Digital Public Infrastructure for Land Governance"
                    Tagline: "One parcel. One identity."
================================================================================
`);

  const metrics = await query(`
    SELECT 
      (SELECT COUNT(*) FROM parcels) AS parcels_count,
      (SELECT COUNT(*) FROM parcel_owners) AS owners_count,
      (SELECT COUNT(*) FROM registrations) AS registrations_count,
      (SELECT COUNT(*) FROM encumbrances) AS encumbrances_count,
      (SELECT COUNT(*) FROM litigation_cases) AS litigation_count,
      (SELECT COUNT(*) FROM mutation_applications) AS mutations_count,
      (SELECT COUNT(*) FROM change_alerts) AS alerts_count,
      (SELECT COUNT(*) FROM audit_log) AS audit_entries
  `);

  console.log('📊 DATABASE STATUS SUMMARY:');
  console.table(metrics.rows[0]);

  console.log(`
🔑 DEMO USER ACCOUNTS:
--------------------------------------------------------------------------------
1. Citizen:        citizen@geodhara.demo       (Password: DemoCitizen@123)
2. Revenue Officer: officer@geodhara.demo      (Password: DemoOfficer@123)
3. Field Officer:  field@geodhara.demo        (Password: DemoField@123)
4. Administrator:  admin@geodhara.demo        (Password: DemoAdmin@123)

🎯 SPECIAL DEMO PARCELS TO DEMONSTRATE:
--------------------------------------------------------------------------------
`);

  const specialParcels = await query(`
    SELECT p.ulpin, p.state_code, p.village, p.legacy_survey_no, p.area_sqm,
           (SELECT COUNT(*) FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') AS encumbrance_count,
           (SELECT COUNT(*) FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) AS litigation_count,
           (SELECT COUNT(*) FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status = 'PENDING') AS alert_count
    FROM parcels p
    WHERE (SELECT COUNT(*) FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') > 0
       OR (SELECT COUNT(*) FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) > 0
       OR (SELECT COUNT(*) FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status = 'PENDING') > 0
    LIMIT 6
  `);

  console.table(specialParcels.rows);

  console.log(`
================================================================================
`);
  await pool.end();
}

printDemoWalkthrough().catch(console.error);
