import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const INITIAL_CHURCHES = [
  { 
    churchId: 'regina-mundi', 
    churchName: 'Regina Mundi Catholic Church', 
    wardLocation: 'Moroka, Soweto', 
    affiliation: 'Catholic',
    commemorationSundayCommitment: true,
    legacyFocusArea: 'Moral Renewal'
  },
  { 
    churchId: 'st-paul', 
    churchName: 'St. Paul’s Anglican Church', 
    wardLocation: 'Jabavu, Soweto', 
    affiliation: 'Anglican',
    commemorationSundayCommitment: true,
    legacyFocusArea: 'Education'
  },
  { 
    churchId: 'holy-cross', 
    churchName: 'Holy Cross Anglican Church', 
    wardLocation: 'Orlando West, Soweto', 
    affiliation: 'Anglican',
    commemorationSundayCommitment: true,
    legacyFocusArea: 'History'
  },
  { 
    churchId: 'grace-bible', 
    churchName: 'Grace Bible Church', 
    wardLocation: 'Pimville, Soweto', 
    affiliation: 'Pentecostal',
    commemorationSundayCommitment: true,
    legacyFocusArea: 'AI/Tech'
  },
  { 
    churchId: 'sacc-soweto', 
    churchName: 'SACC Soweto Affiliate', 
    wardLocation: 'Various', 
    affiliation: 'Inter-denominational',
    commemorationSundayCommitment: true,
    legacyFocusArea: 'Social Justice'
  }
];

const INITIAL_EVENTS = [
  {
    title: "Opening Ceremony: The Legacy Process",
    description: "A formal opening of the 50th Anniversary Legacy Process, featuring keynote addresses from the Wandile Zulu Foundation.",
    speakerName: "Wandile Zulu",
    startTime: Timestamp.fromDate(new Date('2026-06-16T09:00:00')),
    endTime: Timestamp.fromDate(new Date('2026-06-16T11:00:00')),
    location: "Regina Mundi Church"
  },
  {
    title: "Generational Dialogue: Bridge Gen & Rising Gen",
    description: "A panel discussion bridging the gap between those born in the fire of apartheid and today's youth.",
    speakerName: "Father Xolani Dlwathi",
    startTime: Timestamp.fromDate(new Date('2026-06-16T13:00:00')),
    endTime: Timestamp.fromDate(new Date('2026-06-16T15:00:00')),
    location: "Orlando West Hall"
  },
  {
    title: "Economic Renewal Workshop",
    description: "Practical sessions on building a generational blueprint for economic innovation in Soweto.",
    speakerName: "Dr. Thabo Mbeki (Guest)",
    startTime: Timestamp.fromDate(new Date('2026-06-17T10:00:00')),
    endTime: Timestamp.fromDate(new Date('2026-06-17T12:00:00')),
    location: "Grace Bible Church"
  }
];

export async function seedDatabase() {
  const churchesSnap = await getDocs(collection(db, 'churches'));
  if (churchesSnap.empty) {
    for (const church of INITIAL_CHURCHES) {
      await addDoc(collection(db, 'churches'), church);
    }
  }

  const eventsSnap = await getDocs(collection(db, 'events_and_sessions'));
  if (eventsSnap.empty) {
    for (const event of INITIAL_EVENTS) {
      const eventId = Math.random().toString(36).substr(2, 9);
      await addDoc(collection(db, 'events_and_sessions'), {
        ...event,
        eventId
      });
    }
  }
}
