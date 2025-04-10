<script lang="ts" setup>
import { setTitle } from '@utils/title';
import InputText from '@components/input-text.vue';
import { Admin } from '@models/user';
import { getStorageItem } from '@utils/storage';
import { inject, ref, onMounted } from 'vue';
import Spinner from '@components/spinner.vue';
import InputTextarea from '@components/input-textarea.vue';
// import axios from 'axios';
import { devConfig } from '@utils/devConfig';
import {UserType} from "@/models/user"

const { setMessage } = inject('banner') as any;

// 当前登录的管理员ID
let adminID = JSON.parse(getStorageItem('admin') ?? '{}').id;

// 视图类型：个人资料 or 管理员资料
const viewType = ref('personal'); // 'personal' 或 'admin'

// 设置标题
const updateTitle = () => {
  setTitle(viewType.value === 'personal' ? '个人资料' : '管理员资料');
};
updateTitle();

// 个人资料数据
interface PersonalInfoInterface {
  name: string;
  description: string;
  password: string;
  type: UserType; // 明确指定type为number类型
}

// 使用接口定义ref对象
const personalInfo = ref<PersonalInfoInterface>({
  name: '',
  description: '',
  password: '',
  type: 0, // 初始值为0的number类型
});

// 加载个人资料
const loadPersonalInfo = async () => {
  personalStatus.value = 0;
  try {
    // const response = await axios.get(`/api/user/admin/${adminID}`);

    const response = await Admin.getAdmin( adminID,{
            serverEndpoint: devConfig.serverEndpoint,
    })
    const userData = response;
    console.log(response,123123)
    personalInfo.value = {
      name: userData.name,
      description: userData.description || '',
      password: '',
      type: userData.type
    };
    
    personalStatus.value = 1;
  } catch (e) {
    setMessage({
      type: 'error',
      message: '无法获取个人资料',
    });
    personalStatus.value = 2;
  }
};

// 更新个人资料
const updatePersonalInfo = async () => {
  personalSubmitting.value = true;
  try {
    // await axios.put(`/api/user/admin/update/${adminID}`, {
      // name: personalInfo.value.name,
      // description: personalInfo.value.description,
      // password: personalInfo.value.password || undefined,
    // });
    await Admin.updateAdmin(adminID,{
      name: personalInfo.value.name,
      description: personalInfo.value.description,
      password: personalInfo.value.password || undefined,
      type: personalInfo.value.type * 1
    },{
            serverEndpoint: devConfig.serverEndpoint,
    })
    
    setMessage({
      type: 'success',
      message: '成功更新个人资料',
    });
    
    setTimeout(() => {
      loadPersonalInfo();
      personalSubmitting.value = false;
    }, 1000);
  } catch (e) {
    setMessage({
      type: 'error',
      message: e.response?.data?.message || '更新失败',
    });
    personalSubmitting.value = false;
  }
};

const personalStatus = ref(0); // 0: 加载中, 1: 加载成功, 2: 加载失败
const personalSubmitting = ref(false);

// 管理员列表数据
const adminList:any = ref([]);
const listLoading = ref(false);

// 当前选中的管理员ID
const selectedAdminId:any = ref("");

// 管理员详细信息
const adminDetail = ref({
  name: '',
  description: '',
  password: '',
  type: 0,
});

const adminStatus = ref(0);
const adminSubmitting = ref(false);
const showModal = ref(false);
const modalContent = ref({});

// 获取所有管理员列表
const fetchAdminList = async () => {
  listLoading.value = true;
  try {
    // const response = await axios.get('/api/user/admin');
    const response = await Admin.listAdmin( {
                serverEndpoint: devConfig.serverEndpoint,
    })
    adminList.value = response;
    
    // 如果列表不为空且未选择管理员，默认选择第一个
    if (adminList.value.length > 0 && !selectedAdminId.value) {
      selectedAdminId.value = adminList.value[0].id;
      getAdmin(selectedAdminId.value);
    }
    
    listLoading.value = false;
  } catch (e) {
    setMessage({
      type: 'error',
      message: '获取管理员列表失败',
    });
    listLoading.value = false;
  }
};

// 获取指定管理员信息
const getAdmin = async (id:string) => {
  adminStatus.value = 0;
  try {
    // const response = await axios.get(`/api/user/admin/${id}`);
    const response = await Admin.getAdmin(id, {
                serverEndpoint: devConfig.serverEndpoint,
    })
    const adminData = response;
    
    adminDetail.value = {
      name: adminData.name,
      description: adminData.description || '',
      password: '',
      type:adminData.type ||0,
    };
    
    adminStatus.value = 1;
  } catch (e) {
    setMessage({
      type: 'error',
      message: '无法获取管理员信息',
    });
    adminStatus.value = 2;
  }
};

// 选择管理员
const selectAdmin = (id:string) => {
  selectedAdminId.value = id;
  getAdmin(id);
  console.log(id,"id")
};

// 显示管理员详情模态框
const showAdminDetail = () => {
  if (selectedAdminId.value) {
    modalContent.value = adminDetail.value;
    showModal.value = true;
  }
};

// 提交更新管理员
const updateAdmin = async () => {
  adminSubmitting.value = true;
  try {
    // await axios.put(`/api/user/admin/update/${selectedAdminId.value}`, {
      // name: adminDetail.value.name,
      // description: adminDetail.value.description,
      // password: adminDetail.value.password || undefined,
    // });
    await Admin.updateAdmin(selectedAdminId.value,{
      name: adminDetail.value.name,
      description: adminDetail.value.description,
      password: adminDetail.value.password || undefined,
      type: adminDetail.value.type * 1
    },
    {
                serverEndpoint: devConfig.serverEndpoint,
    }
    )
    setMessage({
      type: 'success',
      message: '成功更新管理员信息',
    });
    
    setTimeout(() => {
      fetchAdminList();
      getAdmin(selectedAdminId.value);
      adminSubmitting.value = false;
    }, 1000);
  } catch (e) {
    setMessage({
      type: 'error',
      message: e.response?.data?.message || '更新失败',
    });
    adminSubmitting.value = false;
  }
};

// 切换视图类型
const switchView = (type) => {
  viewType.value = type;
  updateTitle();
  
  if (type === 'personal') {
    loadPersonalInfo();
  } else {
    fetchAdminList();
  }
};

// 组件加载时获取个人资料
onMounted(() => {
  loadPersonalInfo();
});
</script>

<template>
  <div>
    <!-- 顶部标签切换 -->
    <div class="flex border-b mb-6">
      <div 
        :class="['px-4 py-2 cursor-pointer font-medium', 
          viewType === 'personal' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700']"
        @click="switchView('personal')"
      >
        个人资料
      </div>
      <div 
        :class="['px-4 py-2 cursor-pointer font-medium', 
          viewType === 'admin' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700']"
        @click="switchView('admin')"
      >
        管理员资料
      </div>
    </div>

    <!-- 个人资料视图 -->
    <div v-if="viewType === 'personal'">
      <h2 class="mb-4 text-2xl font-black">个人资料</h2>
      
      <Spinner v-if="personalStatus === 0" />
      
      <div v-else-if="personalStatus === 1" class="lg:flex lg:w-full lg:items-start lg:space-x-8">
        <form class="w-md space-y-2" @submit.prevent="(updatePersonalInfo())">
          <input-text 
            v-model="personalInfo.name" 
            label="名称" 
            name="name" 
            placeholder="请输入名称……" 
            type="text" 
          />
          
          <input-textarea 
            v-model="personalInfo.description" 
            label="简介" 
            name="description" 
            placeholder="请输入简介……" 
          />
          
          <input-text
            v-model="personalInfo.password"
            label="密码"
            name="password"
            placeholder="留空则不修改密码"
            type="password"
          />
          
          <input-text
            v-model="personalInfo.type"
            label="type"
            name="type"
            placeholder="类型"
            type="text"
          />

          <button
            :disabled="personalSubmitting"
            class="bg-primary hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 mt-8 flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-2 font-medium text-white transition duration-200"
            type="submit"
          >
            <Spinner v-if="personalSubmitting" size="sm" />
            <span v-else>保存</span>
          </button>
        </form>
        
        <div class="w-md rounded-lg border p-4">
          <h2 class="mb-4 text-2xl font-black">预览个人资料</h2>
          <h3 class="mb-2 text-xl font-black">{{ personalInfo.name }}</h3>
          <p>{{ personalInfo.description }}</p>
        </div>
      </div>
      
      <p v-else class="text-red-500">
        无法获取个人资料信息；
        <a class="text-primary dark:text-primary-200 underline" href="#" @click.prevent="loadPersonalInfo">重试</a>
      </p>
    </div>

    <!-- 管理员资料视图 -->
    <div v-else>
      <h2 class="mb-4 text-2xl font-black">管理员资料</h2>
      
      <div class="flex flex-col md:flex-row w-full gap-6">
        <!-- 左侧管理员列表 -->
        <div class="w-full md:w-1/3">
          <div class="admin-detail border rounded-lg p-4">
            <h3 class="text-xl font-bold mb-4 text-blue-500">管理员列表</h3>
            
            <div class="admin-list">
              <Spinner v-if="listLoading" />
              <div v-else-if="adminList.length === 0" class="text-gray-500 py-2">
                暂无管理员数据
              </div>
              <div 
                v-else
                v-for="admin in adminList" 
                :key="admin.id"
                :class="['admin-item p-2 mb-2 cursor-pointer rounded-lg flex items-center', 
                  selectedAdminId === admin.id ? 'bg-blue-100 text-blue-600 border-2 border-blue-500' : 'hover:bg-gray-100']"
                @click="selectAdmin(admin.id)"
              >
                <div class="text-lg font-semibold">{{ admin.name }}</div>
              </div>
            </div>
          </div>
          
          <!-- 侧边详情面板 -->
          <!-- <div class="card-container border rounded-lg p-4 mt-4">
            <h3 class="text-xl font-bold mb-2 text-blue-500">管理员详情</h3>
            <div class="cursor-pointer text-blue-500 font-medium mb-2 hover:underline" @click="showAdminDetail">管理员等级</div>
            <div class="cursor-pointer text-blue-500 font-medium mb-2 hover:underline" @click="showAdminDetail">管理员简介</div>
            <div class="cursor-pointer text-blue-500 font-medium mb-2 hover:underline" @click="showAdminDetail">查看详情</div>
          </div> -->
        </div>
        
        <!-- 右侧管理员详细信息和编辑表单 -->
        <div class="w-full md:w-2/3">
          <Spinner v-if="adminStatus === 0" />
          
          <div v-if="selectedAdminId && adminStatus !== 2" class="border rounded-lg p-4">
            <h3 class="text-xl font-bold mb-4 text-blue-500">管理员详细信息</h3>
            
            <div v-if="adminStatus === 1" style="height: 400px">
              <!-- 表单部分 -->
              <!-- <form class="space-y-4" @submit.prevent="updateAdmin">
                <input-text 
                  v-model="adminDetail.name" 
                  label="名称" 
                  name="name" 
                  placeholder="请输入名称……" 
                  type="text" 
                />
                
                <input-textarea 
                  v-model="adminDetail.description" 
                  label="简介" 
                  name="description" 
                  placeholder="请输入简介……" 
                />
                
                <input-text
                  v-model="adminDetail.password"
                  label="密码"
                  name="password"
                  placeholder="留空则不修改密码"
                  type="password"
                /> -->

                <!-- <input-text
                  v-model="adminDetail.type"
                  label="类型"
                  name="type"
                  placeholder="类型"
                  type="text"
                /> -->
                
                <!-- <div class="flex justify-end mt-4">
                  <button
                    :disabled="adminSubmitting"
                    class="bg-blue-500 hover:bg-blue-600 px-4 py-2 text-white font-medium rounded-md"
                    type="submit"
                  >
                    <Spinner v-if="adminSubmitting" size="sm" class="mr-2" />
                    <span>保存</span>
                  </button>
                </div>
              </form> -->
              <div v-if="adminStatus === 1" class="space-y-4">
  <!-- 只读信息展示 -->
  <div class="mb-4">
    <div class="text-sm font-medium text-gray-700 mb-1">名称</div>
    <div class="p-2 bg-gray-50 rounded-md border border-gray-200">
      {{ adminDetail.name }}
    </div>
  </div>
  
  <div class="mb-4">
    <div class="text-sm font-medium text-gray-700 mb-1">类型</div>
    <div class="p-2 bg-gray-50 rounded-md border border-gray-200">
      {{ adminDetail.type }}
    </div>
  </div>
  <div class="mb-4">
    <div class="text-sm font-medium text-gray-700 mb-1">简介</div>
    <div class="p-2 bg-gray-50 rounded-md border border-gray-200 min-h-[80px]">
      {{ adminDetail.description || '暂无简介' }}
    </div>
  </div>
  
  
 
</div>
            </div>
          </div>
          
          <div v-else-if="!selectedAdminId" class="text-gray-500 p-4 border rounded-lg">
            请在左侧选择一个管理员查看详情
          </div>
          
          <p v-if="adminStatus === 2" class="text-red-500 p-4 border rounded-lg">
            无法获取管理员信息；
            <a class="text-blue-500 underline" href="#" @click.prevent="getAdmin(selectedAdminId)">重试</a>
          </p>
        </div>
      </div>
    </div>
    
    <!-- 模态框 -->
    <!-- <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">管理员详情</h3>
        <div class="mb-4">
          <div class="font-semibold">名称：</div>
          <div>{{ modalContent.name }}</div>
        </div>
        <div class="mb-4">
          <div class="font-semibold">简介：</div>
          <div>{{ modalContent.description || '暂无简介' }}</div>
        </div>
        <div class="flex justify-end">
          <button 
            class="bg-blue-500 hover:bg-blue-600 px-4 py-2 text-white font-medium rounded-md"
            @click="showModal = false"
          >
            关闭
          </button>
        </div>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.admin-list {
  max-height: 400px;
  overflow-y: auto;
}

.admin-item {
  transition: all 0.2s;
}

/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>