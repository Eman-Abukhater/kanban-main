
// <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-2">
// <Disclosure>
//   {({ open }) => (
//     <>
//       <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75 hover:bg-purple-200">
//         <span>What is your refund policy?</span>
//         <ChevronUpIcon
//           className={`${
//             open ? "rotate-180 transform" : ""
//           } h-5 w-5 text-purple-500`}
//         />
//       </Disclosure.Button>
//       <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
//         If you're unhappy with your purchase for any
//         reason, email us within 90 days and we'll
//         refund you in full, no questions asked.
//       </Disclosure.Panel>
//     </>
//   )}
// </Disclosure>
// <Disclosure as="div" className="mt-2">
//   {({ open }) => (
//     <>
//       <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75 hover:bg-purple-200">
//         <span>Do you offer technical support?</span>
//         <ChevronUpIcon
//           className={`${
//             open ? "rotate-180 transform" : ""
//           } h-5 w-5 text-purple-500`}
//         />
//       </Disclosure.Button>
//       <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
//         No.
//       </Disclosure.Panel>
//     </>
//   )}
// </Disclosure>
// </div>
















// {kanbanTasks.map((_t, index) => (
//     <div
//       key={index}
//       className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800 dark:text-white"
//     >
//       <div>
//         {/* <input
//           type="checkbox"
//           className="h-5 w-5 rounded-md"
//           value={_t.completed ? "on" : "off"}
//           checked={_t.completed}
//           onChange={() =>
//             handleToggleTaskCompleted(index)
//           }
//         ></input> */}
//         {/* mine part for edit */}
//         <span className="ml-2">{_t.title}</span>
//       </div>
//       <div>
//         <button
//           style={{ marginRight: "7px" }}
//           role="button"
//           aria-label="update task"
//           onClick={() => handleDetailTask(_t, index)}
//         >
//           <span className="sr-only">Submit task</span>
//           <span className="h-5 w-1 text-green-600 hover:text-green-500">
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               strokeWidth={1.5}
//               stroke="currentColor"
//               className="h-6 w-6"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
//               />
//             </svg>
//           </span>
//         </button>
//         {_t.addedBy === userInfo.username &&
//           _t.completed === false && (
//             <button
//               role="button"
//               aria-label="delete task"
//               onClick={() =>
//                 handleDeleteTask(index, _t.kanbanTaskId)
//               }
//             >
//               <span className="sr-only">
//                 Delete task
//               </span>
//               <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-500" />
//             </button>
//           )}
//       </div>
//     </div>
//   ))}
//   <DetailsTaskForm
//     onSubmit={() => {         update expenseReport set current_user_id =250  where exp_ID = 51896
//       handleSubmitTask;
//     }}
//     taskInfo={selectedTask}
//     index={selectedTaskIndex}
//     showForm={showForm}
//     setShowForm={setShowForm}
//   />
//   <AddTaskForm
//     text="Add task"
//     placeholder="Task name..."
//     onSubmit={handleCreateTask}
//     userInfo={userInfo}
//   />
