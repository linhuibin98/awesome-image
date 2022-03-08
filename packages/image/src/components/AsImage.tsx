/* eslint-disable react/no-string-refs */
/* eslint-disable react/no-unknown-property */
import type { PropType } from 'vue-demi'
import {
  Transition,
  defineComponent,
  inject,
  isVue2,
  onMounted,
  ref,
  toRefs,
} from 'vue-demi'

import { useLazy } from '../composables/lazy'
import { useResponsive } from '../composables/responsive'
import type { ImageOptions, ImageProvider } from '../interface'
import useDefaultImageProvider from '../composables/default-image-provider'
import style from './style.module.scss'
export default defineComponent({
  name: 'AsImage',
  components: {
    Transition,
  },
  props: {
    src: { type: String, default: '' },
    width: { type: Number },
    height: { type: Number },
    quantity: { type: Number, default: 0 },
    format: { type: String, default: '' },
    lazy: { type: Boolean, default: false },
    placeholderLazyOffset: { type: String, default: '2000px' },
    imageLazyOffset: { type: String, default: '1000px' },
    responsive: { type: Boolean, default: false },
    progressive: { type: Boolean, default: true },
    breakpoints: { type: Array as PropType<Array<number>>, default: () => [360, 540, 720, 900, 1080] },
    sizes: { type: String, default: '100vw' },
    imageProvider: { type: Function as any, default: useDefaultImageProvider },
    duration: { type: Number, default: 1 },
    autoWebp: { type: Boolean, default: true },
  },
  setup(props) {
    const {
      src,
      responsive,
      progressive,
      lazy,
      placeholderLazyOffset,
      imageLazyOffset,
      breakpoints,
      imageProvider,
      quantity,
      format,
    } = toRefs(props)

    const placeholder = ref<HTMLImageElement>()
    const image = ref<HTMLImageElement>()
    let imageDom = ref<HTMLImageElement>()
    let imageLoaded = ref(false)

    const useImageProvider = inject<ImageProvider>('useImageProvider', imageProvider.value)
    console.log('🚀 ~ file: AsImage.tsx ~ line 61 ~ setup ~ imageProvider.value', imageProvider.value)
    console.log('🚀 ~ file: AsImage.tsx ~ line 61 ~ setup ~ useImageProvider', useImageProvider)

    const placeholderSrcSet = progressive.value
      ? useImageProvider(src, {
        width: 48,
        blur: 2,
      })
      : src

    const options: ImageOptions = {}
    if (quantity.value)
      options.quantity = quantity.value
    if (format.value)
      options.format = format.value

    const imageSrcSet = responsive.value
      ? useResponsive(src, breakpoints, useImageProvider, options)
      : useImageProvider(src, options)

    const pictureOption: ImageOptions = Object.assign({}, options, { format: 'webp' })
    const pictureSrcSet = responsive.value
      ? useResponsive(src, breakpoints, useImageProvider, pictureOption)
      : useImageProvider(src, pictureOption)

    if (lazy.value) {
      const { loaded, image: img } = useLazy(image, imageLazyOffset)
      imageLoaded = loaded
      imageDom = img
      if (progressive.value)
        useLazy(placeholder, placeholderLazyOffset)
    }

    onMounted(() => {
      if (image.value?.complete)
        imageLoaded.value = true
    })
    return {
      placeholderSrcSet,
      imageLoaded,
      imageSrcSet,
      pictureSrcSet,
      imageDom,
      image,
      placeholder,
    }
  },
  render() {
    const renderImg = (type = 'image') => {
      const isImage = type === 'image'
      let className = ''
      if (isImage) {
        if ((isVue2 && this.$scopedSlots.webglfilter) || !!this.$slots.webglfilter)
          className = `${style.image} ${style.hasWebglFilter}`
        else
          className = style.image
      }
      else {
        className = style.imagePlaceholder
      }
      console.log('🚀 ~ file: AsImage.tsx ~ line 121 ~ renderImg ~ className', className)

      const attrs = {
        [this.lazy ? 'data-srcset' : 'srcset']: isImage ? this.imageSrcSet : this.placeholderSrcSet,
        onload: `this.classList.add("${isImage ? style.imageLoaded : style.placeholderLoaded}");`,
      }
      const src = isVue2
        ? {
          attrs,
        }
        : attrs
      return (
        <img
          // {...this.$attrs}
          crossorigin="anonymous"
          ref={isImage ? 'image' : 'placeholder'}
          class={className}
          style={{
            opacity: 0,
            transitionDuration: `${this.duration}s`,
          }}
          width={this.width}
          height={this.height}
          {...src}
          sizes={this.sizes}
          onLoad={() => { this.imageLoaded = true }}
        />
      )
    }

    const renderPicture = () => {
      return this.autoWebp
        ? (
          <picture>
            <source srcset={this.pictureSrcSet} type="image/webp" />
            {renderImg()}
          </picture>
        )
        : renderImg()
    }
    const renderWebglFilter = () => {
      return isVue2
        ? this.$scopedSlots.webglfilter?.({
          image: this.image,
        })
        : this.$slots.webglfilter?.({
          image: this.image,
        })
    }
    return (
      <div class={style.imageWrapper}>
        <div class={style.imageBackground}>
          {isVue2
            ? this.$slots.loading
            : this.$slots.loading?.()}
        </div>
        <div class={style.imagePlaceholderWrapper}>
          {renderImg('placeholder')}
        </div>
        {renderPicture()}
        <transition name="fade">
          {this.imageLoaded
            ? renderWebglFilter()
            : null}
        </transition>
      </div>
    )
  },
})
