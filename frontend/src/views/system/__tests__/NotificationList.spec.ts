import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationList from '../NotificationList.vue'

describe('NotificationList.vue', () => {
  beforeAll(() => {
    // mock APIs
    vi.mock('@/api/system/notification', () => ({
      getNotifications: () => Promise.resolve({ list: [], total: 0 }),
      createNotification: () => Promise.resolve({ id: 1 }),
      updateNotification: () => Promise.resolve({}),
      deleteNotification: () => Promise.resolve({})
    }))
  })

  it('renders and loads list', async () => {
    const wrapper = mount(NotificationList)
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('.toolbar').exists()).toBe(true)
  })
})
