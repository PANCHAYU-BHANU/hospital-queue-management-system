import React from 'react'

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl border border-teal-100 text-center max-w-md">
        <h1 className="text-3xl font-bold text-teal-600 mb-2">
          Hospital Queue System
        </h1>
        <p className="text-slate-500 font-medium">
          Tailwind CSS Manual Setup is 100% Successful! 🚀
        </p>
        <div className="mt-5 inline-block px-6 py-2.5 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 transition cursor-pointer">
          Medical Blue Button
        </div>
      </div>
    </div>
  )
}

export default App