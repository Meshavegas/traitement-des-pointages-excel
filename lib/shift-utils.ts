// Utilitaires pour la gestion des quarts de travail et le calcul des retards
import type { EmployeeData, AttendanceRecord } from "./types";

// Constantes pour les horaires
export const OPERATIONS_SCHEDULES = [
  { label: "Morning", time: "06:00:00" },
  { label: "Afternoon", time: "13:00:00" },
  { label: "Evening", time: "19:30:00" },
];

// Heure de début programmée pour le département ID
export const ID_SCHEDULED_START_TIME = "08:00:00";

// Période de grâce pour le département Operations (en minutes)
export const OPERATIONS_GRACE_PERIOD = 30;

// Add this new helper function at the top with other constants
export const EVENING_SHIFT_START = "19:30:00";

/**
 * Calcule la durée entre deux heures en tenant compte du changement de jour
 */
export function calculateDuration(
  startTime: string,
  endTime: string,
  isEveningShift: boolean
): string {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  let startDate = new Date(2000, 0, 1, startHours, startMinutes);
  let endDate = new Date(2000, 0, 1, endHours, endMinutes);

  // Si c'est un quart de soirée et l'heure de fin est plus tôt que l'heure de début
  // cela signifie que la fin est le jour suivant
  if (isEveningShift && endDate < startDate) {
    endDate = new Date(2000, 0, 2, endHours, endMinutes);
  }

  if (!endTime) {
    return "erreur";
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor(
    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${durationHours}h ${durationMinutes}m`;
}

/**
 * Détermine le quart par défaut pour un employé en fonction de ses pointages
 */
export function determineDefaultShift(employee: EmployeeData): string {
  if (!employee || !employee.allTimeEntries) return "06:00:00";

  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;

  Object.values(employee.allTimeEntries).forEach((entries) => {
    entries.forEach((entry) => {
      const time = entry.time;
      const [hours] = time.split(":").map(Number);

      if (hours >= 4 && hours < 10) morningCount++;
      else if (hours >= 10 && hours < 16) afternoonCount++;
      else eveningCount++;
    });
  });

  if (morningCount > afternoonCount && morningCount > eveningCount) {
    return "06:00:00";
  } else if (afternoonCount > morningCount && afternoonCount > eveningCount) {
    return "13:00:00";
  } else {
    return "19:30:00";
  }
}

/**
 * Détecte le modèle de quart pour un employé
 */
export function detectShiftPattern(employee: EmployeeData): string {
  if (!employee || !employee.allTimeEntries) return "Unknown";

  // Compte les occurrences de chaque quart
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;

  // Analyse toutes les entrées pour déterminer le quart le plus courant
  Object.values(employee.allTimeEntries).forEach((entries) => {
    entries.forEach((entry) => {
      const time = entry.time;
      const [hours] = time.split(":").map(Number);

      if (hours >= 4 && hours < 10) morningCount++;
      else if (hours >= 10 && hours < 16) afternoonCount++;
      else eveningCount++;
    });
  });

  // Détermine le quart prédominant
  if (morningCount > afternoonCount && morningCount > eveningCount) {
    return "Morning (6:00)";
  } else if (afternoonCount > morningCount && afternoonCount > eveningCount) {
    return "Afternoon (13:00)";
  } else if (eveningCount > morningCount && eveningCount > afternoonCount) {
    return "Evening (19:30)";
  } else {
    return "Mixed";
  }
}

/**
 * Détermine l'heure programmée pour un employé
 */
export function determineScheduledTime(
  time: string,
  date: string,
  department: string,
  employeeId: EmployeeData
): string {
  if (department !== "Operation".toUpperCase()) {
    return department === "ID" ? ID_SCHEDULED_START_TIME : "-";
  }

  // Pour le département Operations, nous utiliserons une approche plus sophistiquée
  // D'abord, convertir l'heure en minutes pour une comparaison plus facile
  const [hours, minutes] = time.split(":").map(Number);
  const timeInMinutes = hours * 60 + minutes;

  // Définir les fenêtres de quart avec des limites claires
  // Chaque quart a une fenêtre qui commence 3 heures avant l'heure programmée et se termine 3 heures après
  const shifts = [
    {
      name: "Morning",
      startTime: "06:30:00",
      windowStart: 6 * 60,
      windowEnd: 14 * 60,
    }, // 06:00AM  AM to 14:00 PM
    {
      name: "Afternoon",
      startTime: "13:30:00",
      windowStart: 13 * 60,
      windowEnd: 19.5 * 60,
    }, // 13:00 AM to 19:00 PM
    {
      name: "Evening",
      startTime: "20:00:00",
      windowStart: 19.5 * 60 + 30,
      windowEnd: 30.5 * 60 + 30,
    }, // 19:00 PM to 07:00 AM next day
  ];

  // Vérifie si nous pouvons déterminer le quart en fonction du modèle d'ID de l'employé
  // C'est une approche plus fiable si les ID des employés suivent un modèle lié aux quarts

  // Si aucun modèle dans l'ID de l'employé, déterminer en fonction des fenêtres de temps
  for (const shift of shifts) {
    const shiftStartMinutes =
      Number.parseInt(shift.startTime.split(":")[0]) * 60 +
      Number.parseInt(shift.startTime.split(":")[1]);

    // Si l'heure est dans la fenêtre de ce quart
    if (
      timeInMinutes >= shiftStartMinutes - 180 &&
      timeInMinutes <= shiftStartMinutes + 180
    ) {
      return shift.startTime;
    }
  }

  // Si l'heure ne tombe dans aucune fenêtre, trouver l'heure programmée la plus proche
  // C'est une approche de secours
  let closestShift = shifts[0];
  let minDifference = Number.POSITIVE_INFINITY;

  for (const shift of shifts) {
    const shiftStartMinutes =
      Number.parseInt(shift.startTime.split(":")[0]) * 60 +
      Number.parseInt(shift.startTime.split(":")[1]);
    const difference = Math.abs(timeInMinutes - shiftStartMinutes);

    if (difference < minDifference) {
      minDifference = difference;
      closestShift = shift;
    }
  }

  return closestShift.startTime;
}

/**
 * Calcule le retard ou l'arrivée anticipée en fonction de l'heure programmée
 */
export function calculateDelay(
  arrivalTime: string,
  scheduledTime: string,
  department: string
): { value: string; isDelay: boolean; isOnTime: boolean } {
  if (scheduledTime === "-")
    return { value: "-", isDelay: false, isOnTime: false };

  try {
    const [arrivalHours, arrivalMinutes] = arrivalTime.split(":").map(Number);
    const [scheduledHours, scheduledMinutes] = scheduledTime
      .split(":")
      .map(Number);

    const arrivalDate = new Date(
      2000,
      0,
      1,
      arrivalHours || 0,
      arrivalMinutes || 0
    );

    // Crée la date programmée
    const scheduledDate = new Date(
      2000,
      0,
      1,
      scheduledHours || 0,
      scheduledMinutes || 0
    );

    // Pour le département Operations, ajouter une période de grâce de 30 minutes avant l'heure programmée
    if (department === "Operations") {
      // Crée une date de période de grâce qui est 30 minutes avant l'heure programmée
      const gracePeriodDate = new Date(scheduledDate);
      gracePeriodDate.setMinutes(
        gracePeriodDate.getMinutes() - OPERATIONS_GRACE_PERIOD
      );

      // Si l'arrivée est entre la période de grâce et l'heure programmée, la considérer comme à l'heure (0 minute de retard)
      if (arrivalDate >= gracePeriodDate && arrivalDate <= scheduledDate) {
        return { value: "0min", isDelay: false, isOnTime: true };
      }

      // Si l'arrivée est avant la période de grâce, calculer combien de temps ils étaient en avance par rapport à la période de grâce
      if (arrivalDate < gracePeriodDate) {
        const diffMs = arrivalDate.getTime() - gracePeriodDate.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return {
          value: `${diffMinutes}min`,
          isDelay: false,
          isOnTime: false,
        };
      }

      // Si l'arrivée est après l'heure programmée, calculer le retard normalement
      const diffMs = arrivalDate.getTime() - scheduledDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return { value: `${diffMinutes}min`, isDelay: true, isOnTime: false };
    }

    // Pour les autres départements, utiliser le calcul original
    const diffMs = arrivalDate.getTime() - scheduledDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Si l'arrivée est exactement à l'heure
    if (diffMinutes === 0) {
      return { value: "0min", isDelay: false, isOnTime: true };
    }

    // Si l'arrivée est avant l'heure programmée, afficher comme négatif (en avance)
    if (diffMinutes < 0) {
      return { value: `${diffMinutes}min`, isDelay: false, isOnTime: false };
    }

    // Si l'arrivée est en retard
    return { value: `${diffMinutes}min`, isDelay: true, isOnTime: false };
  } catch (error) {
    return { value: "-", isDelay: false, isOnTime: false };
  }
}

/**
 * Formate les entrées de temps pour l'affichage
 */
export function formatTimeEntries(
  entries: AttendanceRecord[] = [],
  department: string,
  employeeId: string,
  employeeShifts: Record<string, string>
): { entries: AttendanceRecord[]; scheduledTimes: string[] } {
  if (!entries || entries.length === 0) {
    return { entries: [], scheduledTimes: [] };
  }

  // Trie les entrées par heure
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Détermine l'heure programmée pour chaque entrée
  const scheduledTimes = sortedEntries.map((entry) =>
    determineScheduledTime(entry.time, department, employeeId, employeeShifts)
  );

  return { entries: sortedEntries, scheduledTimes };
}
