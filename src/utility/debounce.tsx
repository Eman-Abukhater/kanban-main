// type TimerDictionary = Record<string, NodeJS.Timeout | null>;

// export function debounceWithCardId<T>(
//   fn: (args: T) => Promise<void>,
//   ms: number
// ): [(args: T, kanbanCardId: number) => void, (kanbanCardId: number) => void] {
//   const timers: TimerDictionary = {};

//   const debouncedFunc = (args: T, kanbanCardId: number) => {
//     if (timers[kanbanCardId]) {
//       clearTimeout(timers[kanbanCardId]!);
//     }

//     timers[kanbanCardId] = setTimeout(async () => {
//       try {
//         await fn(args);
//       } finally {
//         delete timers[kanbanCardId];
//       }
//     }, ms);
//   };

//   const teardown = (kanbanCardId: number) => {
//     if (timers[kanbanCardId]) {
//       clearTimeout(timers[kanbanCardId]!);
//       delete timers[kanbanCardId];
//     }
//   };

//   return [debouncedFunc, teardown];
// }
type TimerDictionary = Record<string, NodeJS.Timeout>;
let timers: TimerDictionary = {};
let lastKanbanCardId: number | null = null;

export function debounceWithCardId<T>(
  fn: (args: T) => Promise<void>,
  ms: number
): [(args: T, kanbanCardId: number) => void, () => void] {
  const debouncedFunc = (args: T, kanbanCardId: number) => {
    // Clear the timer for the previous card move if it's the same card
    if (lastKanbanCardId === kanbanCardId && timers[kanbanCardId] !== null) {
      clearTimeout(timers[kanbanCardId]!);
      //clearInterval(timers);
      delete timers[lastKanbanCardId];
    }
    lastKanbanCardId = kanbanCardId;
    // Set a new timer for the current card move
    timers[kanbanCardId] = setTimeout(async () => {
      try {
        await fn(args);
      } finally {
        //delete timers[kanbanCardId];
        // Update the last card ID
      }
    }, ms);
  };

  const teardown = () => {
    // Clear the timer for the last card move
    if (lastKanbanCardId !== null && timers[lastKanbanCardId] !== null) {
      clearTimeout(timers[lastKanbanCardId]!);
      delete timers[lastKanbanCardId];
      lastKanbanCardId = null; // Clear the last card ID
    }
  };

  return [debouncedFunc, teardown];
}

// type TimerDictionary = Record<string, NodeJS.Timeout>;

// export function debounceWithCardId<T>(
//   fn: (args: T) => Promise<void>,
//   ms: number
// ): [(args: T, kanbanCardId: number) => void, (kanbanCardId: number) => void] {
//   const timers: TimerDictionary = {};

//   const debouncedFunc = (args: T, kanbanCardId: number) =>
//     new Promise<void>((resolve) => {
//       if (timers[kanbanCardId]) {
//         clearTimeout(timers[kanbanCardId]);
//       }

//       timers[kanbanCardId] = setTimeout(() => {
//         resolve(fn(args));
//         delete timers[kanbanCardId];
//       }, ms);
//     });

//   const teardown = (kanbanCardId: number) => {
//     if (timers[kanbanCardId]) {
//       clearTimeout(timers[kanbanCardId]);
//       delete timers[kanbanCardId];
//     }
//   };

//   return [debouncedFunc, teardown];
// }
