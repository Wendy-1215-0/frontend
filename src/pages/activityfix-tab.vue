<script lang="ts" setup>
import ActivityEdit from '@components/activity-edit.vue';
import { ref } from 'vue';

interface Model {
    id: string;
    name: string;
    date: string;
    description: string;
    location: string;
}

const { id, editable, onSaved } = defineProps<{
    id: string;
    editable: boolean;
    onSaved: (activity: Model) => void;
}>();

const showModal = ref(true);

const closeModal = () => {
    showModal.value = false;
};

const handleSaved = (activity: Model) => {
    onSaved(activity);
    closeModal();
};
</script>

<template>
   <Teleport to="body">
        <div v-if="showModal" class="fixed inset-0 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-black">活动修改</h3>
                    <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <activity-edit :id="id" :editable="editable" :on-saved="handleSaved" />
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* 可以添加一些过渡动画 */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>