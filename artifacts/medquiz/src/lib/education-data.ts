import type { SelectOption } from '@/components/custom-select';

export const MEDICAL_UNIVERSITIES: SelectOption[] = [
  { value: 'TTA', label: 'Toshkent Tibbiyot Akademiyasi (TTA)', subLabel: 'Toshkent' },
  { value: 'ToshPTI', label: 'Toshkent Pediatriya Tibbiyot Instituti (SAMPI)', subLabel: 'Toshkent' },
  { value: 'TDSI', label: 'Toshkent Davlat Stomatologiya Instituti (TDSI)', subLabel: 'Toshkent' },
  { value: 'ToshFARMI', label: 'Toshkent Farmatsevtika Instituti (ToshFARMI)', subLabel: 'Toshkent' },
  { value: 'SamDTU', label: 'Samarqand Davlat Tibbiyot Universiteti (SamDTU)', subLabel: 'Samarqand' },
  { value: 'ADTI', label: 'Andijon Davlat Tibbiyot Instituti (ADTI)', subLabel: 'Andijon' },
  { value: 'BuxDTI', label: 'Abu Ali ibn Sino nomidagi Buxoro Davlat Tibbiyot Instituti (BuxDTI)', subLabel: 'Buxoro' },
  { value: 'FJSTI', label: 'Farg‘ona Jamoat Salomatligi Tibbiyot Instituti (FJSTI)', subLabel: 'Farg‘ona' },
  { value: 'TJSTI', label: 'Termiz Jamoat Salomatligi Tibbiyot Instituti (TJSTI)', subLabel: 'Termiz' },
  { value: 'QTI', label: 'Qoraqalpog‘iston Tibbiyot Instituti (QTI)', subLabel: 'Nukus' },
  { value: 'CAU', label: 'Central Asian University (Akfa) — Tibbiyot maktabi', subLabel: 'Xususiy OTM' },
  { value: 'EMU', label: 'European Medical University (EMU)', subLabel: 'Xususiy OTM' },
  { value: 'Alfraganus', label: 'Alfraganus University — Tibbiyot fakulteti', subLabel: 'Xususiy OTM' },
  { value: 'other', label: 'Boshqa tibbiyot oliygohi', subLabel: 'OTM' },
];

export const MEDICAL_FACULTIES: SelectOption[] = [
  { value: 'Davolash ishi', label: 'Davolash ishi (General Medicine)' },
  { value: 'Pediatriya ishi', label: 'Pediatriya ishi (Pediatrics)' },
  { value: 'Stomatologiya', label: 'Stomatologiya (Dentistry)' },
  { value: 'Farmatsevtika', label: 'Farmatsevtika (Pharmacy)' },
  { value: 'Tibbiy profilaktika', label: 'Tibbiy profilaktika va jamoat salomatligi' },
  { value: 'Oliy hamshiralik ishi', label: 'Oliy hamshiralik ishi' },
  { value: 'Xalq tabobati', label: 'Xalq tabobati (Traditional Medicine)' },
  { value: 'Biotibbiyot', label: 'Biotibbiyot va neyrofan' },
  { value: 'Tibbiy biologiya', label: 'Tibbiy biologiya va genetika' },
  { value: 'other', label: 'Boshqa fakultet / Yo‘nalish' },
];

export const STUDY_COURSES: SelectOption[] = [
  { value: '1-kurs', label: '1-kurs talabasi' },
  { value: '2-kurs', label: '2-kurs talabasi' },
  { value: '3-kurs', label: '3-kurs talabasi' },
  { value: '4-kurs', label: '4-kurs talabasi' },
  { value: '5-kurs', label: '5-kurs talabasi' },
  { value: '6-kurs', label: '6-kurs talabasi' },
  { value: 'Magistratura', label: 'Magistratura talabasi' },
  { value: 'Klinik ordinatura', label: 'Klinik ordinatura / Rezidentura' },
  { value: 'Doktorantura', label: 'Doktorantura (PhD / DSc)' },
  { value: 'Shifokor', label: 'Amaliyotchi shifokor' },
];
