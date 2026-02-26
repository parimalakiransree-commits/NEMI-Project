
export interface Patient {
  id: number;
  age: number;
  deliveryType: 'Vaginal' | 'Cesarean';
  laborDuration: number; // hours
  complications: boolean;
  los: number; // length of stay in days
  location: 'Urban' | 'Rural';
  readmitted: boolean;
  riskScore?: number;
}

export function generateMaternityData(count: number = 500): Patient[] {
  const patients: Patient[] = [];
  
  for (let i = 0; i < count; i++) {
    const age = Math.floor(Math.random() * (45 - 18 + 1)) + 18;
    const deliveryType = Math.random() > 0.7 ? 'Cesarean' : 'Vaginal';
    const location = Math.random() > 0.4 ? 'Urban' : 'Rural';
    const laborDuration = Math.floor(Math.random() * 20) + 4; // 4 to 24 hours
    const complications = Math.random() > 0.8;
    
    // Base LOS
    let los = deliveryType === 'Cesarean' ? 4 : 2;
    if (complications) los += 2;
    los += Math.floor(Math.random() * 2);

    // Calculate Readmission Probability (Ground Truth for simulation)
    // Factors: Cesarean (+15%), Complications (+25%), Rural (+10%), Age > 35 (+10%), LOS < 3 (+15%)
    let prob = 0.05; // Base 5%
    if (deliveryType === 'Cesarean') prob += 0.15;
    if (complications) prob += 0.25;
    if (location === 'Rural') prob += 0.10;
    if (age > 35) prob += 0.10;
    if (los < 3 && deliveryType === 'Vaginal') prob += 0.15;
    
    const readmitted = Math.random() < prob;

    patients.push({
      id: i + 1,
      age,
      deliveryType,
      laborDuration,
      complications,
      los,
      location,
      readmitted
    });
  }
  
  return patients;
}
