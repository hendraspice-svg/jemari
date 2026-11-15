import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  evaluateTriagePriority, 
  calculateBedOccupancyRate, 
  getRecommendedBed,
  getResponseTimeStatus 
} from './triage';
import { Bed } from '../types/index';

test('evaluateTriagePriority classifies critical SpO2 (<90%) as P1 Merah', () => {
  const result = evaluateTriagePriority({
    oxygenSaturation: 86,
    heartRate: 115,
    systolic: 120,
    respiratoryRate: 28,
  }, 'Sesak napas berat tiba-tiba');

  assert.equal(result.category, 'P1');
  assert.ok(result.reason.includes('Saturasi O2 kritis'));
  assert.ok(result.priorityScore >= 100);
});

test('evaluateTriagePriority classifies severe hypotension as P1 Merah', () => {
  const result = evaluateTriagePriority({
    systolic: 75,
    heartRate: 125,
    oxygenSaturation: 96,
  }, 'Keringat dingin lemas');

  assert.equal(result.category, 'P1');
  assert.ok(result.reason.includes('Hipotensi'));
});

test('evaluateTriagePriority classifies tachycardia & severe pain as P2 Kuning', () => {
  const result = evaluateTriagePriority({
    oxygenSaturation: 97,
    heartRate: 120,
    systolic: 130,
    respiratoryRate: 22,
    painScale: 8,
  }, 'Nyeri perut kanan bawah hebat');

  assert.equal(result.category, 'P2');
  assert.ok(result.reason.includes('Takikardia'));
});

test('evaluateTriagePriority classifies stable normal vitals as P3 Hijau', () => {
  const result = evaluateTriagePriority({
    oxygenSaturation: 99,
    heartRate: 78,
    systolic: 118,
    respiratoryRate: 18,
    temperature: 36.8,
    painScale: 2,
    consciousness: 'Compos Mentis',
  }, 'Batuk pilek sejak kemarin');

  assert.equal(result.category, 'P3');
  assert.equal(result.priorityScore, 10);
});

test('evaluateTriagePriority marks Death on Arrival as P0', () => {
  const result = evaluateTriagePriority({}, 'Tidak bernapas di rumah', true);
  assert.equal(result.category, 'P0');
});

test('calculateBedOccupancyRate calculates correct percentage', () => {
  const mockBeds: Bed[] = [
    { id: '1', name: 'Bed 1', category: 'resusitasi', categoryLabel: 'Resusitasi', status: 'occupied', oxygenEquipped: true, monitorEquipped: true },
    { id: '2', name: 'Bed 2', category: 'tindakan', categoryLabel: 'Tindakan', status: 'occupied', oxygenEquipped: true, monitorEquipped: false },
    { id: '3', name: 'Bed 3', category: 'umum', categoryLabel: 'Umum', status: 'available', oxygenEquipped: true, monitorEquipped: false },
    { id: '4', name: 'Bed 4', category: 'umum', categoryLabel: 'Umum', status: 'cleaning', oxygenEquipped: false, monitorEquipped: false },
  ];

  // 2 out of 4 occupied = 50%
  const bor = calculateBedOccupancyRate(mockBeds);
  assert.equal(bor, 50);

  // Empty beds array handles gracefully
  assert.equal(calculateBedOccupancyRate([]), 0);
});

test('getRecommendedBed assigns resusitasi bed for P1 when available', () => {
  const mockBeds: Bed[] = [
    { id: 'b1', name: 'Bed 1 Resusitasi', category: 'resusitasi', categoryLabel: 'Resusitasi', status: 'available', oxygenEquipped: true, monitorEquipped: true },
    { id: 'b2', name: 'Bed 2 Tindakan', category: 'tindakan', categoryLabel: 'Tindakan', status: 'available', oxygenEquipped: true, monitorEquipped: false },
  ];

  const assigned = getRecommendedBed('P1', mockBeds);
  assert.equal(assigned?.id, 'b1');
});

test('getResponseTimeStatus flags delay when threshold exceeded', () => {
  // P2 target is 10 minutes
  const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const status = getResponseTimeStatus(pastTime, 'P2');
  assert.equal(status.isDelayed, true);
  assert.equal(status.targetMinutes, 10);
  assert.ok(status.minutesElapsed >= 14);
});
