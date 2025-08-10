import { useState, useEffect } from "react";

export default function AddEditBoardModal({
  isOpen,
  onClose,
  handleEditTitle,
  handleAddBoardClick,
  board,
}: any) {
  const [title, setTitle] = useState<string | null>(null);
  const [isEditing, setisEditing] = useState(false);

  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
  };

  useEffect(() => {
    board ? setisEditing(true) : setisEditing(false);
    setTitle(board?.title);
  }, [board]);

  const handleSubmit = async () => {
    //if empty return
    if (!title) {
      // Prevent adding an empty board title
      setTitle("");
      onClose();
      return;
    }

    if (isEditing) {
      handleEditTitle(title, board?.boardId);
    }

    if (!isEditing) {
      handleAddBoardClick(title);
    }

    setTitle("");
    onClose();
  };

  const handleCloseModal = () => {
    setTitle("");
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="modal-overlay absolute inset-0 bg-black opacity-50"></div>

      <div className="modal-container z-50 mx-auto w-11/12 overflow-y-auto rounded bg-white shadow-lg md:max-w-md">
        {/* Add your modal content here */}
        <div className="modal-content px-6 py-4 text-left">
          <h1 className="flex flex-row text-xl font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>

            {isEditing ? "Edit Board Title" : "Add New Board"}
          </h1>
          <input
            type="text"
            value={title?.toString()}
            onChange={handleTitleChange}
            className="mt-2 w-full rounded border p-2"
            defaultValue={""}
            maxLength={25}
          />
          <div className="mt-4 flex justify-end space-x-4">
            <button
              onClick={handleCloseModal}
              className="modal-close p-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`modal-close ${
                isEditing
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              } rounded p-2 text-white`}
            >
              {isEditing ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
