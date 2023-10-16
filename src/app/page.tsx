"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function Home() {

  const [form, setForm] = useState({
    username: 'sarah.bishop',
    password: '',
  })
  return (
    <div className="container">
      <div className="title">
        <div className="text">
          <p className='p'>Enter Windows Password</p>
        </div>
        <div className="windowButtons">
          <button className='button questionMark'>?</button>
          <button className='button close'>X</button>
        </div>
      </div>
      <div className="body">
        <div className="description">
          <Image alt="Credential icon" src="/windows-98-logo.png" width={200} height={150} />
        </div>
        <form className='form'>
          <div className="formItem">
            <label className='label'>Username:</label>
            <input className='input' type='text' value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}></input>
          </div>
          <div className="formItem">
            <label className='label'>Password:</label>
            <input className='input' type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}></input>
          </div>
          <div className="options">
            <button className="button btn-lg" type='button'>OK</button>
            <button className="button btn-lg" type='button'>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
